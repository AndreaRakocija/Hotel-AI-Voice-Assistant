import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
    // const { prompt, kb } = req.body;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(req.body)
//             body: JSON.stringify({
//                 model: "gpt-4o-realtime-preview", // gpt-4o-realtime-preview, gpt-3.5-turbo
//                 messages: [
//                     {
//                         role: "system",
//                         content: `You are a helpful hotel assistant. Use the following knowledge base when answering questions.
// If the answer is not in the KB, answer naturally using your general knowledge.
// Knowledge base:\n${JSON.stringify(kb, null, 2)}`
//                     },
//                     { role: "user", content: prompt }
//                 ],
//                 max_tokens: 300,
//                 temperature: 0.2
//             })
        });

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to get response from OpenAI" });
    }
});

app.listen(3000, () => console.log("Proxy server running on http://localhost:3000"));
