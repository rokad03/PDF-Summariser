import { Worker } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
const worker = new Worker("pdf-processing", async (job) => {
    console.log("Processing PDF", job.data);
    const data = job.data;
    const loader = new PDFLoader(data.destination + "/" + data.filename);
    console.log(data.destination + "/" + data.filename)
    const allDocs = await loader.load();
    // Filter out empty pages that would produce 0-dimension embeddings
    const docs = allDocs.filter(doc => doc.pageContent && doc.pageContent.trim().length > 0);
    console.log(`PDF loaded: ${allDocs.length} pages, ${docs.length} non-empty`);

    // const client = new QdrantClient({
    //     url: "http://localhost:6333"
    // })
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: "AIzaSyBJbWx_FOtlgjjrfm5NMhG3hgCx97xcuAM",
        model: "gemini-embedding-001",
    })
    let vectorStore;
    try {
        // Try connecting to existing collection
        vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
            url: "http://localhost:6333",
            collectionName: "pdf-docs",
        });
        await vectorStore.addDocuments(docs);
    } catch (e) {
        // Collection doesn't exist yet, create it
        vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
            url: "http://localhost:6333",
            collectionName: "pdf-docs",
        });
    }
    console.log("All docs are added to the vector store")
    return { result: "PDF processed successfully" };
}, {
    connection: {
        host: "localhost",
        port: 6379,
    },
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});

worker.on("error", (err) => {
    console.error("Worker error:", err);
});

worker.on("completed", (job) => {
    console.log(`Job ${job?.id} completed successfully`);
});