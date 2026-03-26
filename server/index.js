import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { Queue } from "bullmq";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";

const queue = new Queue("pdf-processing", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: "AIzaSyBJbWx_FOtlgjjrfm5NMhG3hgCx97xcuAM",
    model: "gemini-embedding-001",
})

const chatModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: "AIzaSyBJbWx_FOtlgjjrfm5NMhG3hgCx97xcuAM",
});

const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: "http://localhost:6333",
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

app.post('/upload/pdf', upload.single("pdf"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    console.log("File uploaded:", req.file.originalname, "->", req.file.filename);
    queue.add("process-pdf", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        destination: req.file.destination
    });
    return res.json({
        message: "PDF uploaded successfully",
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
    });
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

