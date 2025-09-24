import React, { useEffect, useRef, useState } from "react";

// ----- CONFIG -----
const OPENAI_ENABLED = true; // set true to enable OpenAI fallback (requires API key)

const KB = {
  rooms: {
    standard: {
      name: "Standard Room",
      description: "A cozy room with a queen bed, 32\" TV, and complimentary Wi-Fi. Max 2 guests.",
      highlights: ["Queen bed", "32\" TV", "Wi-Fi", "Max 2 guests"]
    },
    suite: {
      name: "Suite",
      description: "Spacious with a king bed, private balcony, jacuzzi, and mini-bar. Perfect for couples and longer stays.",
      highlights: ["King bed", "Balcony", "Jacuzzi", "Mini-bar"]
    }
  },
  packages: {
    romantic: {
      name: "Romantic Package",
      description: "Includes suite upgrade (subject to availability), candlelight dinner, champagne, and rose petal turn-down service."
    }
  },
  dining: {
    dinner: {
      description: "Dinner is served at our rooftop restaurant from 6 PM to 10 PM. Please reserve for groups of 6 or more."
    }
  },
  surprises: {
    birthday: {
      description: "We can arrange birthday surprises such as cakes, balloons, or flowers in your room. Please request 24h in advance."
    }
  }
};

async function fetchOpenAIAnswer(messages) {
  const recentMessages = messages.slice(-10); // keep last 10 for context
  const res = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional, empathetic hotel assistant.
Use the following hotel knowledge base to answer questions accurately.
Never dump raw data; always respond conversationally.

Knowledge Base: ${JSON.stringify(KB)}`
        },
        ...recentMessages.map(m => ({ role: m.role, content: m.text }))
      ],
      temperature: 0.3,
      max_tokens: 300
    })
  });

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "(no response)";
}

export default function HotelAIVoiceDemo() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello — I'm your Hotel AI Assistant. Ask me about rooms, packages, dining, or say 'talk to a human'." },
  ]);
  const [status, setStatus] = useState("ready");
  const [callbackLog, setCallbackLog] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    console.log("Messages array:", messages);
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("SpeechRecognition not supported in this browser. Use Chrome or Edge.");
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onstart = () => setStatus("listening");
    recog.onend = () => { setListening(false); setStatus("ready"); };
    recog.onerror = (e) => { console.error("Recognition error", e); setStatus("Recognition error: " + e.error); setListening(false); };
    recog.onresult = (e) => { const text = e.results[0][0].transcript; setTranscript(text); submitUserMessage(text); };
    recognitionRef.current = recog;
  }, []);

  function speak(text) {
    if (!window.speechSynthesis) return;
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
  }

  function toggleListening() {
    const recog = recognitionRef.current;
    if (!recog) return;
    if (!listening) { try { recog.start(); setListening(true); } catch(e) { console.warn(e); } }
    else { recog.stop(); setListening(false); }
  }

  async function submitUserMessage(text) {
    // 1️⃣ Add user message immediately
    const updatedMessages = [...messages, { role: "user", text }];
    setMessages(updatedMessages);

    // 2️⃣ Handle human request
    if (/\b(human|person|operator|representative|agent|reps)\b/i.test(text)) {
      simulateStaffNotification(text);
      const reply = "I’ve notified our staff. They will follow up by phone or email shortly.";
      // setMessages(prev => [...prev, { role: "assistant", text: reply }]);
      setMessages([...updatedMessages, { role: "assistant", text: reply }]);
      speak(reply);
      return;
    }

    // 3️⃣ Let AI handle it
    if (OPENAI_ENABLED) {
      setStatus("Asking AI...");
      try {
        const aiReply = await fetchOpenAIAnswer(updatedMessages); // pass full updated history
        setMessages(prev => [...prev, { role: "assistant", text: aiReply }]); // append only once
        speak(aiReply);
        setStatus("ready");
      } catch (e) {
        console.error(e);
        const err = "Sorry, something went wrong when contacting the AI.";
        setMessages(prev => [...prev, { role: "assistant", text: err }]);
        speak(err);
        setStatus("ready");
      }
      return;
    }

    // 4️⃣ Fallback if AI is disabled
    const fallback = "I don’t have that info right now. Try asking about rooms, packages, dining, check-in, or say 'talk to a human'.";
    setMessages(prev => [...prev, { role: "assistant", text: fallback }]);
    speak(fallback);
  }

  function simulateStaffNotification(userText) {
    const entry = { id: Date.now(), time: new Date().toLocaleString(), userText, phone: "(555) 555-0199" };
    setCallbackLog((l) => [entry, ...l]);
  }

  const samples = [
    "Tell me about the romantic package",
    "Do you have a suite available?",
    "What time is dinner served?",
    "I want to talk to a person",
    "How do I check in after midnight?",
  ];

  return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-lg flex flex-col overflow-hidden">

          {/* Header */}
          <header
              className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-t-3xl">
            <h1 className="text-xl md:text-2xl font-bold">Hotel AI Assistant — Voice Demo</h1>
            <div className="text-sm font-medium">Status: <span>{status}</span></div>
          </header>

          {/* Main content */}
          <main className="flex flex-col md:flex-row gap-6 p-4 flex-1 overflow-hidden">

            {/* Chat Section */}
            <section className="flex-1 flex flex-col h-[500px] md:h-[600px]">

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 rounded-xl shadow-inner" id="chat-box">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                      <div
                          className={`max-w-[75%] p-3 rounded-xl ${m.role === 'assistant' ? 'bg-white shadow-md' : 'bg-sky-500 text-white shadow-lg'}`}>
                        <p className="text-sm">{m.text}</p>
                      </div>
                    </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="mt-3 flex gap-3">
                <button onClick={toggleListening}
                        className={`p-3 rounded-full shadow-md transition-transform ${listening ? 'scale-105 bg-red-500 text-white' : 'bg-white'}`}
                        aria-pressed={listening}>
                  {listening ? 'Stop' : 'Speak 🎙️'}
                </button>
              </div>

              <div className="mt-3 flex gap-3">
                <input type="text" placeholder="Type a question..."
                       className="w-full py-50 pl-50 pr-169 rounded-2xl shadow-lg text-lg focus:outline-none focus:ring-4 focus:ring-sky-400 focus:border-sky-400 transition-all"
                       value={transcript} onChange={e => setTranscript(e.target.value)} onKeyDown={e => {
                  if (e.key === 'Enter' && transcript.trim()) {
                    submitUserMessage(transcript.trim());
                    setTranscript('');
                  }
                }}/>
                <button onClick={() => {
                  if (transcript.trim()) {
                    submitUserMessage(transcript.trim());
                    setTranscript('');
                  }
                }} className="px-5 py-3 bg-sky-600 text-white font-semibold rounded-xl shadow-md hover:bg-sky-700">Send
                </button>
              </div>
              <br/>


              {/* Sample Buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {samples.map(s => (
                    <button key={s} onClick={() => submitUserMessage(s)}
                            className="px-3 py-1 bg-white border rounded-full shadow-sm hover:bg-sky-50 text-sm">{s}</button>
                ))}
              </div>
            </section>

            {/* Callback Log */}
            <aside className="w-80 flex-shrink-0">
              <div className="p-4 border rounded-xl bg-white shadow-md h-full flex flex-col">
                <h3 className="font-semibold mb-3 text-lg">Human Callback Log</h3>
                {callbackLog.length === 0 ? (
                    <p className="text-sm text-gray-500">No callbacks requested yet.</p>
                ) : (
                    <ul className="flex-1 overflow-y-auto space-y-2">
                      {callbackLog.map(c => (
                          <li key={c.id} className="p-3 border rounded-lg shadow-sm">
                            <div className="font-semibold text-sm">{c.time}</div>
                            <div className="truncate">{c.userText}</div>
                            <div className="text-xs text-gray-400">Phone: {c.phone}</div>
                          </li>
                      ))}
                    </ul>
                )}
              </div>
            </aside>

          </main>
        </div>
      </div>
  );
}
