import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";


const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-embedding-001",
})

const chatModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
});

const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: "pdf-docs",
});
const retriever = vectorStore.asRetriever({
    k: 2
});
// Ensure uploads directory exists
const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    return res.json({ message: "Hello World" });
});

app.post('/upload/pdf', upload.single("pdf"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    console.log("File uploaded:", req.file.originalname, "->", req.file.filename);

    try {
        const filePath = req.file.destination + "/" + req.file.filename;
        const loader = new PDFLoader(filePath);
        const allDocs = await loader.load();
        const docs = allDocs.filter(doc => doc.pageContent && doc.pageContent.trim().length > 0);

        // Add to Qdrant vector store
        await vectorStore.addDocuments(docs);
        console.log(`Successfully processed and embedded ${docs.length} pages.`);

        // (Optional) Remove the local file since we sent it to cloud storage if needed 
        // fs.unlinkSync(filePath);

        return res.json({
            message: "PDF processed successfully",
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
        });
    } catch (error) {
        console.error("Error processing PDF:", error);
        return res.status(500).json({ message: "Error processing PDF", error: error.message });
    }
});
app.get('/chat', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: "Query is required" });
    }
    const result = await retriever.invoke(query);

    const context = result.map(doc => doc.pageContent).join('\n\n');
    const SYSTEM_PROMPT = `
You are a helpful assistant.
Use the following context to answer the question.
If the answer is not in the context, say "Sorry, but answer is not present in context".

Context:
${context}

Question:
${query}

Answer: 
`;

    const aiResponse = await chatModel.invoke(SYSTEM_PROMPT);

    return res.json({ answer: aiResponse.content, sources: result });
})
app.listen(8000, () => {
    console.log("Server is running on port 8000");
});

