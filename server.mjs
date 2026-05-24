import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const SYSTEM = { role: "system", content: "Tu es Guideon, un assistant IA cree par Brother Victor Bossou." };

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, user_id = 'default' } = req.body;
    let history = [];
    if (supabase) {
      const { data } = await supabase
        .from('conversations')
        .select('role, content')
        .eq('user_id', user_id)
        .order('created_at', { ascending: true })
        .limit(20);
      history = data || [];
    }
    const messages = [SYSTEM, ...history, { role: 'user', content: message }];
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages })
    });
    const data = await response.json();
    if (!data.choices) return res.status(500).json({ error: "Erreur API" });
    const reply = data.choices[0].message.content;
    if (supabase) {
      await supabase.from('conversations').insert([
        { user_id, role: 'user', content: message },
        { user_id, role: 'assistant', content: reply }
      ]);
    }
    res.json({ reply });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/image', async (req, res) => {
  try {
    const { prompt } = req.body;
    res.json({ url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const d = await r.json();
    res.json({ result: d.AbstractText || d.Answer || "Aucun resultat." });
  } catch(e) { res.json({ result: null }); }
});

app.listen(process.env.PORT || 3000, () => console.log("Guideon actif !"));
