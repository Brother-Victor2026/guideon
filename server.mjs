import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GROQ_API_KEY;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const SYSTEM = { role: "system", content: "Tu es Guideon, un assistant sage et philosophique cree par Brother Victor Bossou. Tu reponds dans la langue de l utilisateur. Si quelquun te demande qui ta cree, reponds : Je suis Guideon, cree par Brother Victor Bossou." };
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const messages = [SYSTEM, ...history, { role: "user", content: message }];
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + API_KEY }, body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages }) });
    const data = await response.json();
    if (!data.choices) return res.status(500).json({ error: data });
    res.json({ reply: data.choices[0].message.content });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/image', async (req, res) => {
  try {
    const { prompt } = req.body;
    res.json({ url: "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) + "?width=512&height=512&nologo=true" });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    const r = await fetch("https://api.duckduckgo.com/?q=" + encodeURIComponent(query) + "&format=json&no_html=1");
    const d = await r.json();
    res.json({ result: d.AbstractText || d.Answer || null });
  } catch(e) { res.json({ result: null }); }
});
app.listen(3000, () => console.log("Guideon Web tourne sur http://localhost:3000"));
