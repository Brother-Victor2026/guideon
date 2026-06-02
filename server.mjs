import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SECRET = process.env.JWT_SECRET || 'guideon2026';

const DB = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : null;
const SB = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

function hashPwd(p) { return crypto.createHash('sha256').update(p + SECRET).digest('hex'); }
function makeToken(id, email) {
  const p = Buffer.from(JSON.stringify({ id, email, exp: Date.now() + 7*24*60*60*1000 })).toString('base64');
  return p + '.' + crypto.createHmac('sha256', SECRET).update(p).digest('hex');
}
function checkToken(t) {
  try {
    const [p, s] = t.split('.');
    if (crypto.createHmac('sha256', SECRET).update(p).digest('hex') !== s) return null;
    const d = JSON.parse(Buffer.from(p, 'base64').toString());
    return d.exp > Date.now() ? d : null;
  } catch { return null; }
}

const SYSTEM = { role: "system", content: "Tu es Guideon, assistant IA sage cree par Brother Victor Bossou. Tu reponds dans la langue de l utilisateur. Tu as acces a l historique complet des conversations. Ne dis jamais que tu n as pas de memoire." };

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    const r = await fetch(`${DB}/users`, {
      method: 'POST',
      headers: { ...SB, 'Prefer': 'return=representation' },
      body: JSON.stringify({ email, password: hashPwd(password), name })
    });
    const data = await r.json();
    if (!Array.isArray(data) || !data[0]) return res.status(400).json({ error: 'Email deja utilise' });
    res.json({ token: makeToken(data[0].id, email), name: data[0].name, email });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await fetch(`${DB}/users?email=eq.${encodeURIComponent(email)}&password=eq.${hashPwd(password)}`, { headers: SB });
    const users = await r.json();
    if (!Array.isArray(users) || !users[0]) return res.status(401).json({ error: 'Identifiants incorrects' });
    res.json({ token: makeToken(users[0].id, email), name: users[0].name, email });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, token } = req.body;
    let userId = 'default';
    let dbHistory = [];
    if (token && DB) {
      const user = checkToken(token);
      if (user) {
        userId = String(user.id);
        const r = await fetch(`${DB}/conversations?user_id=eq.${userId}&order=created_at.asc&limit=30`, { headers: SB });
        const d = await r.json();
        if (Array.isArray(d)) dbHistory = d;
      }
    }
    const hist = dbHistory.length > 0 ? dbHistory : (history || []);
    const messages = [SYSTEM, ...hist.map(h => ({ role: h.role, content: h.content })), { role: 'user', content: message }];
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages })
    });
    const data = await response.json();
    if (!data.choices) return res.status(500).json({ error: "Erreur API" });
    const reply = data.choices[0].message.content;
    if (token && DB) {
      const user = checkToken(token);
      if (user) await fetch(`${DB}/conversations`, {
        method: 'POST',
        headers: { ...SB, 'Prefer': 'return=minimal' },
        body: JSON.stringify([{ user_id: String(user.id), role: 'user', content: message }, { user_id: String(user.id), role: 'assistant', content: reply }])
      });
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
