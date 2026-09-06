import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer();


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


const GEMINI_MODEL = "gemini-3.5-flash-lite";

app.use(cors());
app.use(express.json());

// Serve static frontend files from starter directory
const starterPath = path.resolve(import.meta.dirname, '../starter');
app.use(express.static(starterPath));

const PORT = 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(starterPath, 'index.html'));
});

app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.error("Error generating content:", e);
        res.status(500).json({ message: e.message });
    }
});

app.post("/generate-from-image", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "File tidak ditemukan. Pastikan key di Postman adalah 'image' dan tipe-nya 'File'."
        });
    }

    const { prompt } = req.body || {};
    const promptText = prompt || "Jelaskan gambar ini.";
    const base64Image = req.file.buffer.toString("base64");

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: promptText },
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: req.file.mimetype
                    }
                }
            ],
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.error("Error:", e);
        res.status(500).json({ message: e.message });
    }
});

app.post("/generate-from-document", upload.single("document"), async (req, res) => {
    const { prompt } = req.body;
    const base64Document = req.file.buffer.toString("base64");

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt ?? "Jelaskan dokumen ini.", type: "text" },
                { inlineData: { data: base64Document, mimeType: req.file.mimetype } }
            ],
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
    }
});

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
    const { prompt } = req.body;
    const base64Audio = req.file.buffer.toString("base64");

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt ?? "Jelaskan audio ini.", type: "text" },
                { inlineData: { data: base64Audio, mimeType: req.file.mimetype } }
            ],
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
    }
});

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    try {
        if (!Array.isArray(conversation)) throw new Error("Conversation must be an array of messages.");

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.9,
                systemInstruction: "jawab dengan bahasa indonesia, gunakan bahasa yang santai, dan bahasa anak muda dengan menggunakan Loe Gue."
            },
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));