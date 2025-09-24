// import fetch from "node-fetch";
//
// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         return res.status(405).json({ error: "Method not allowed" });
//     }
//
//     try {
//         const response = await fetch("https://api.openai.com/v1/chat/completions", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//             },
//             body: JSON.stringify(req.body),
//         });
//
//         const data = await response.json();
//         res.status(200).json(data);
//     } catch (err) {
//         console.error("OpenAI fetch error:", err);
//         res.status(500).json({ error: "Failed to get response from OpenAI" });
//     }
// }


import fetch from "node-fetch";

// 🏨 Hotel Knowledge Base
const KB = {
    rooms: {
        standard: {
            name: "Standard Room",
            description: "A cozy room with a queen bed, 32\" TV, and complimentary Wi-Fi. Max 2 guests.",
            highlights: ["Queen bed", "32\" TV", "Wi-Fi", "Max 2 guests"],
        },
        suite: {
            name: "Suite",
            description:
                "Spacious with a king bed, private balcony, jacuzzi, and mini-bar. Perfect for couples and longer stays.",
            highlights: ["King bed", "Balcony", "Jacuzzi", "Mini-bar"],
        },
    },
    packages: {
        romantic: {
            name: "Romantic Package",
            description:
                "Includes suite upgrade (subject to availability), candlelight dinner, champagne, and rose petal turn-down service.",
        },
    },
    dining: {
        dinner: {
            description:
                "Dinner is served at our rooftop restaurant from 6 PM to 10 PM. Please reserve for groups of 6 or more.",
        },
    },
    surprises: {
        birthday: {
            description:
                "We can arrange birthday surprises such as cakes, balloons, or flowers in your room. Please request 24h in advance.",
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { messages } = req.body;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are a professional, empathetic hotel assistant.
Always use the following hotel knowledge base when answering questions.
Respond naturally and conversationally — do not dump raw JSON.

Knowledge Base: ${JSON.stringify(KB)}`,
                    },
                    ...(messages || []),
                ],
                temperature: 0.3,
                max_tokens: 300,
            }),
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        console.error("OpenAI fetch error:", err);
        res.status(500).json({ error: "Failed to get response from OpenAI" });
    }
}
