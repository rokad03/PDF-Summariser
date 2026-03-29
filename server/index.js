import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { YoutubeTranscript } from "youtube-transcript/dist/youtube-transcript.esm.js";
import { Document } from "@langchain/core/documents";
import Stripe from "stripe";

// ─── AI Models ────────────────────────────────────────
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-embedding-001",
});

const chatModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
});

// ─── Vector Store ─────────────────────────────────────
const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: "pdf-docs",
});

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY,
});
try {
    await qdrantClient.createPayloadIndex("pdf-docs", {
        field_name: "metadata.workspace",
        field_schema: "keyword",
        wait: true,
    });
    console.log("Verified Qdrant payload index for metadata.workspace");
} catch (err) {
    if (err.message && err.message.includes("already exists")) {
        console.log("Qdrant index for metadata.workspace already exists.");
    } else {
        console.warn("Notice: Payload index creation output:", err.message);
    }
}

// ─── File Upload Setup ────────────────────────────────
const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// ─── Express App ──────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// ─── Health Check ─────────────────────────────────────
app.get('/', (req, res) => {
    return res.json({ message: "AI Study Hub API is running!" });
});

// ═══════════════════════════════════════════════════════
// ─── STRIPE CHECKOUT ──────────────────────────────────
// ═══════════════════════════════════════════════════════
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

app.post('/create-checkout-session', async (req, res) => {
    if (!stripe) {
        console.warn("Stripe key is missing. Simulating successful checkout for dev mode.");
        return res.json({ url: `${req.headers.origin}?success=true` });
    }
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'AI Study Hub Premium' },
                    unit_amount: 999, // $9.99
                    recurring: { interval: 'month' }
                },
                quantity: 1,
            }],
            success_url: `${req.headers.origin}?success=true`,
            cancel_url: `${req.headers.origin}?canceled=true`,
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════
// ─── UPLOAD PDF ───────────────────────────────────────
// ═══════════════════════════════════════════════════════
app.post('/upload/pdf', upload.single("pdf"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    const workspace = req.body.workspace || "default";
    console.log(`File uploaded: ${req.file.originalname} -> workspace: ${workspace}`);

    try {
        const filePath = req.file.destination + "/" + req.file.filename;
        const loader = new PDFLoader(filePath);
        const allDocs = await loader.load();
        const docs = allDocs
            .filter(doc => doc.pageContent && doc.pageContent.trim().length > 0)
            .map((doc, idx) => new Document({
                pageContent: doc.pageContent,
                metadata: {
                    ...doc.metadata,
                    workspace,
                    source: req.file.originalname,
                    sourceType: "pdf",
                    pageNumber: idx + 1,
                },
            }));

        await vectorStore.addDocuments(docs);
        console.log(`Processed ${docs.length} pages for workspace "${workspace}".`);

        return res.json({
            message: "PDF processed successfully",
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            workspace,
            pages: docs.length,
        });
    } catch (error) {
        console.error("Error processing PDF:", error);
        return res.status(500).json({ message: "Error processing PDF", error: error.message });
    }
});

// ═══════════════════════════════════════════════════════
// ─── UPLOAD YOUTUBE ───────────────────────────────────
// ═══════════════════════════════════════════════════════
app.post('/upload/youtube', async (req, res) => {
    const { url, workspace = "default" } = req.body;
    if (!url) {
        return res.status(400).json({ message: "YouTube URL is required" });
    }

    try {
        console.log(`Fetching transcript for: ${url}`);
        const transcriptItems = await YoutubeTranscript.fetchTranscript(url);
        const fullText = transcriptItems.map(item => item.text).join(" ");

        if (!fullText.trim()) {
            return res.status(400).json({ message: "No transcript found for this video. It may not have captions." });
        }

        // Split transcript into chunks of ~2000 chars for better embedding
        const chunkSize = 2000;
        const chunks = [];
        for (let i = 0; i < fullText.length; i += chunkSize) {
            chunks.push(fullText.slice(i, i + chunkSize));
        }

        const docs = chunks.map((chunk, idx) => new Document({
            pageContent: chunk,
            metadata: {
                workspace,
                source: url,
                sourceType: "youtube",
                chunkIndex: idx + 1,
                totalChunks: chunks.length,
            },
        }));

        await vectorStore.addDocuments(docs);
        console.log(`Processed ${docs.length} transcript chunks for workspace "${workspace}".`);

        return res.json({
            message: "YouTube transcript processed successfully",
            url,
            workspace,
            chunks: docs.length,
            textLength: fullText.length,
        });
    } catch (error) {
        console.error("Error processing YouTube:", error);
        return res.status(500).json({ message: "Error processing YouTube video", error: error.message });
    }
});

// ═══════════════════════════════════════════════════════
// ─── CHAT (with workspace filter) ─────────────────────
// ═══════════════════════════════════════════════════════
app.get('/chat', async (req, res) => {
    const { query, workspace } = req.query;
    if (!query) {
        return res.status(400).json({ message: "Query is required" });
    }

    try {
        // Build retriever with optional workspace filter
        let result;
        if (workspace && workspace !== "all") {
            const filteredRetriever = vectorStore.asRetriever({
                k: 4,
                filter: {
                    must: [{ key: "metadata.workspace", match: { value: workspace } }],
                },
            });
            result = await filteredRetriever.invoke(query);
        } else {
            const retriever = vectorStore.asRetriever({ k: 4 });
            result = await retriever.invoke(query);
        }

        const context = result.map(doc => doc.pageContent).join('\n\n');

        const SYSTEM_PROMPT = `
You are a helpful AI study assistant.
Use the following context to answer the question clearly and thoroughly.
If you reference specific information, mention the source document when available.
If the answer is not in the context, say "Sorry, but the answer is not present in the uploaded documents."

Context:
${context}

Question:
${query}

Answer:
`;

        const aiResponse = await chatModel.invoke(SYSTEM_PROMPT);

        // Include source metadata for citations
        const sources = result.map(doc => ({
            content: doc.pageContent.slice(0, 200) + "...",
            source: doc.metadata?.source || "Unknown",
            sourceType: doc.metadata?.sourceType || "unknown",
            pageNumber: doc.metadata?.pageNumber || null,
            workspace: doc.metadata?.workspace || "default",
        }));

        return res.json({ answer: aiResponse.content, sources });
    } catch (error) {
        console.error("Error in chat:", error);
        return res.status(500).json({ message: "Error processing chat", error: error.message });
    }
});

// ═══════════════════════════════════════════════════════
// ─── QUIZ GENERATION ──────────────────────────────────
// ═══════════════════════════════════════════════════════
app.post('/quiz/generate', async (req, res) => {
    const { workspace = "default", numQuestions = 10, difficulty = "medium" } = req.body;

    try {
        // Retrieve diverse documents from the workspace
        const retriever = vectorStore.asRetriever({
            k: 8,
            filter: workspace !== "all"
                ? { must: [{ key: "metadata.workspace", match: { value: workspace } }] }
                : undefined,
        });
        const result = await retriever.invoke("key concepts and important information");
        const context = result.map(doc => doc.pageContent).join('\n\n');

        if (!context.trim()) {
            return res.status(400).json({ message: "No documents found in this workspace to generate a quiz." });
        }

        const QUIZ_PROMPT = `
You are an expert quiz generator for students. Based on the following study material, generate exactly ${numQuestions} multiple choice questions.

Difficulty level: ${difficulty}

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option should be correct
- Include a brief explanation for the correct answer
- Questions should test understanding, not just memorization
- Return ONLY valid JSON, no markdown, no code fences

Return this exact JSON structure:
[
  {
    "id": 1,
    "question": "What is...?",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "B",
    "explanation": "The correct answer is B because..."
  }
]

Study Material:
${context}
`;

        const aiResponse = await chatModel.invoke(QUIZ_PROMPT);
        let quizData;
        try {
            // Strip markdown code fences if present
            let raw = aiResponse.content.trim();
            raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
            quizData = JSON.parse(raw);
        } catch {
            return res.status(500).json({
                message: "Failed to parse quiz data from AI",
                raw: aiResponse.content,
            });
        }

        return res.json({ quiz: quizData, workspace });
    } catch (error) {
        console.error("Error generating quiz:", error);
        return res.status(500).json({ message: "Error generating quiz", error: error.message });
    }
});

// ═══════════════════════════════════════════════════════
// ─── QUIZ EXPLANATION ─────────────────────────────────
// ═══════════════════════════════════════════════════════
app.post('/quiz/explain', async (req, res) => {
    const { question, userAnswer, correctAnswer, workspace = "default" } = req.body;

    try {
        const retriever = vectorStore.asRetriever({
            k: 3,
            filter: workspace !== "all"
                ? { must: [{ key: "metadata.workspace", match: { value: workspace } }] }
                : undefined,
        });
        const result = await retriever.invoke(question);
        const context = result.map(doc => doc.pageContent).join('\n\n');

        const EXPLAIN_PROMPT = `
A student answered a quiz question incorrectly. Help them understand why.

Question: ${question}
Student's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

Relevant study material:
${context}

Please explain:
1. Why the correct answer is right (with evidence from the material)
2. Why the student's answer is wrong
3. A helpful tip to remember this concept
Keep it concise and encouraging.
`;

        const aiResponse = await chatModel.invoke(EXPLAIN_PROMPT);
        return res.json({ explanation: aiResponse.content });
    } catch (error) {
        console.error("Error explaining quiz:", error);
        return res.status(500).json({ message: "Error generating explanation", error: error.message });
    }
});

// ═══════════════════════════════════════════════════════
// ─── MIND MAP GENERATION ──────────────────────────────
// ═══════════════════════════════════════════════════════
app.get('/mindmap', async (req, res) => {
    const { workspace = "default" } = req.query;

    try {
        const retriever = vectorStore.asRetriever({
            k: 8,
            filter: workspace !== "all"
                ? { must: [{ key: "metadata.workspace", match: { value: workspace } }] }
                : undefined,
        });
        const result = await retriever.invoke("main topics concepts structure overview");
        const context = result.map(doc => doc.pageContent).join('\n\n');

        if (!context.trim()) {
            return res.status(400).json({ message: "No documents found in this workspace." });
        }

        const MINDMAP_PROMPT = `
Analyze the following study material and create a mind map using Mermaid.js mindmap syntax.

Rules:
- Use the Mermaid mindmap syntax (not flowchart)
- Start with "mindmap" on the first line
- Use indentation to show hierarchy (2 spaces per level)
- Include the main topic as root, then key concepts as branches
- Add 2-3 sub-points under each key concept
- Keep labels concise (max 5 words each)
- Do NOT use special characters like parentheses, brackets, or quotes in labels
- Return ONLY the mermaid code, no markdown fences, no explanation

Example format:
mindmap
  root((Main Topic))
    Branch One
      Detail A
      Detail B
    Branch Two
      Detail C
      Detail D

Study Material:
${context}
`;

        const aiResponse = await chatModel.invoke(MINDMAP_PROMPT);
        let mermaidCode = aiResponse.content.trim();
        mermaidCode = mermaidCode.replace(/^```mermaid\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

        return res.json({ mermaid: mermaidCode, workspace });
    } catch (error) {
        console.error("Error generating mind map:", error);
        return res.status(500).json({ message: "Error generating mind map", error: error.message });
    }
});

// ═══════════════════════════════════════════════════════
// ─── DELETE DOCUMENT ──────────────────────────────────
// ═══════════════════════════════════════════════════════
app.delete('/document', async (req, res) => {
    const { source, workspace = "default" } = req.body;
    if (!source) {
        return res.status(400).json({ message: "Source is required" });
    }

    try {
        console.log(`Deleting documents for source: ${source} in workspace: ${workspace}`);
        await qdrantClient.delete("pdf-docs", {
            wait: true,
            filter: {
                must: [
                    { key: "metadata.workspace", match: { value: workspace } },
                    { key: "metadata.source", match: { value: source } }
                ]
            }
        });
        return res.json({ message: "Document deleted successfully" });
    } catch (error) {
        console.error("Error deleting document:", error);
        return res.status(500).json({ message: "Error deleting document", error: error.message });
    }
});

// ─── Start Server ─────────────────────────────────────
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`AI Study Hub server running on port ${PORT}`);
});
