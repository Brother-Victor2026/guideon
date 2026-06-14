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

const MODELS = {
  'llama-70b': 'llama-3.3-70b-versatile',
  'llama-8b': 'llama-3.1-8b-instant',
  'mixtral': 'mixtral-8x7b-32768',
  'gemma': 'llama-3.1-8b-instant'
};

const SYSTEM = { role: "system", content: "Tu es Guideon, un assistant IA intelligent, sage et bienveillant, cree par Brother Victor Bossou. Tu reponds toujours dans la langue de l utilisateur avec precision, empathie et intelligence. Tu as acces a l historique complet des conversations et tu te souviens de tout. Ne dis jamais que tu n as pas de memoire. Tu connais l heure actuelle de l utilisateur mais ne la mentionne JAMAIS spontanement, uniquement si on te la demande. Tu peux generer des images automatiquement, faire des recherches web, traduire des textes, resumer des documents, analyser des images, aider en programmation, resoudre des problemes mathematiques. Ne dis JAMAIS que tu ne peux pas faire ces choses. Tu reponds avec bienveillance et professionnalisme. Ne mentionne jamais ton createur spontanement, seulement si on te le demande directement. Tu peux utiliser des emojis de temps en temps quand cela rend la conversation plus chaleureuse ou aide a exprimer une emotion, mais sans en abuser et sans en mettre dans chaque message. Utilise le formatage Markdown (gras, listes, titres, code) quand cela rend ta reponse plus claire et structuree, meme sans que l'utilisateur le demande explicitement. Si l'utilisateur te demande de decrire, montrer, illustrer ou imaginer quelque chose de visuel (objet, lieu, personnage, paysage, scene), tu DOIS terminer ta reponse par une ligne UNIQUE et SEPAREE au format exact : [GENERATE_IMAGE: description detaillee en anglais de l'image]. Pour les autres types de questions (conversation, conseils, calculs, code, etc.), n'utilise cette balise que si une image apporterait une vraie valeur ajoutee." };

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    const r = await fetch(`${DB}/users`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=representation' }, body: JSON.stringify({ email, password: hashPwd(password), name }) });
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

const IMG_TAG_START = '[GENERATE_IMAGE';

function partialTagSuffixLength(s) {
  const max = Math.min(s.length, IMG_TAG_START.length);
  for (let len = max; len > 0; len--) {
    if (s.slice(-len) === IMG_TAG_START.slice(0, len)) return len;
  }
  return 0;
}

async function callStabilityAI(rawPrompt) {
  try {
    const transResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: `Translate to English, reply with ONLY the English words: "${rawPrompt}"` }], max_tokens: 150 })
    });
    const transData = await transResp.json();
    const englishPrompt = transData.choices?.[0]?.message?.content?.trim() || rawPrompt;
    console.error('Prompt envoye a HuggingFace:', englishPrompt);
    let imgResp;
    for (let attempt = 0; attempt < 3; attempt++) {
      imgResp = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.HUGGINGFACE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: englishPrompt })
      });
      if (imgResp.ok) break;
      if (imgResp.status !== 503) break;
      await new Promise(r => setTimeout(r, 4000));
    }
    if (!imgResp.ok) {
      const errText = await imgResp.text();
      console.error('HuggingFace erreur:', imgResp.status, errText.slice(0, 300));
      return null;
    }
    const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await imgResp.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    console.error('HuggingFace exception:', e.message);
    return null;
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, token, model, temperature, session_id, userTime } = req.body;
    let userId = 'default';
    let dbHistory = [];
    let userInstructions = '';
    if (token && DB) {
      const user = checkToken(token);
      if (user) {
        userId = String(user.id);
        const [hRes, uRes] = await Promise.all([
          fetch(`${DB}/conversations?user_id=eq.${userId}&session_id=eq.${session_id}&order=created_at.asc&limit=30`, { headers: SB }),
          fetch(`${DB}/users?id=eq.${userId}&select=instructions`, { headers: SB })
        ]);
        const hData = await hRes.json();
        const uData = await uRes.json();
        if (Array.isArray(hData)) dbHistory = hData;
        if (Array.isArray(uData) && uData[0]) userInstructions = uData[0].instructions || '';
      }
    }
    const timeWords = ['heure','time','date','quelle heure','what time'];
    const asksTime = timeWords.some(w => message.toLowerCase().includes(w));
    const sysContent = SYSTEM.content + (userInstructions ? `\n\nInstructions: ${userInstructions}` : '') + (userTime && asksTime ? `\n\nL heure exacte est ${userTime}.` : '');
    const SYSTEM_MSG = { role: 'system', content: sysContent };
    const hist = dbHistory.length > 0 ? dbHistory : (history || []);
    const messages = [SYSTEM_MSG, ...hist.filter(h=>h&&h.role&&h.content).map(h => ({ role: h.role, content: h.content })), { role: 'user', content: message }];
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODELS[model] || "llama-3.3-70b-versatile", messages, temperature: parseFloat(temperature) || 0.7, stream: true })
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(500).json({ error: errData.error?.message || JSON.stringify(errData) });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let reply = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let pending = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data: ')) continue;
        const d = t.slice(6);
        if (d === '[DONE]') continue;
        try {
          const parsed = JSON.parse(d);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            reply += content;
            pending += content;
            let fullMatch = pending.match(/\[GENERATE_IMAGE:\s*([\s\S]+?)\]/);
            while (fullMatch) {
              const before = pending.slice(0, fullMatch.index);
              if (before) res.write(`data: ${JSON.stringify({ content: before })}\n\n`);
              const desc = fullMatch[1].trim();
              if (desc) {
                try {
                  const imgUrl = await callStabilityAI(desc);
                  if (imgUrl) res.write(`data: ${JSON.stringify({ image: imgUrl })}\n\n`);
                } catch (e) {}
              }
              pending = pending.slice(fullMatch.index + fullMatch[0].length);
              fullMatch = pending.match(/\[GENERATE_IMAGE:\s*([\s\S]+?)\]/);
            }
            const startIdx = pending.indexOf(IMG_TAG_START);
            if (startIdx !== -1) {
              const before = pending.slice(0, startIdx);
              if (before) res.write(`data: ${JSON.stringify({ content: before })}\n\n`);
              pending = pending.slice(startIdx);
            } else {
              const holdLen = partialTagSuffixLength(pending);
              if (pending.length > holdLen) {
                const toSend = pending.slice(0, pending.length - holdLen);
                res.write(`data: ${JSON.stringify({ content: toSend })}\n\n`);
                pending = pending.slice(pending.length - holdLen);
              }
            }
          }
        } catch (e) {}
      }
    }
    if (pending) {
      res.write(`data: ${JSON.stringify({ content: pending })}\n\n`);
      pending = '';
    }
    reply = reply.replace(/\[GENERATE_IMAGE:\s*[\s\S]+?\]/g, '').trim();
    if (token && DB) {
      const user = checkToken(token);
      if (user) {
        const isFirst = dbHistory.length === 0;
        await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify([
          { user_id: String(user.id), role: 'user', content: message, session_id },
          { user_id: String(user.id), role: 'assistant', content: reply, session_id }
        ])});
        if (isFirst && session_id) {
          const titleRes = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: `Génère un titre court (max 5 mots) pour cette conversation: "${message}". Réponds UNIQUEMENT avec le titre.` }], max_tokens: 20 }) });
          const titleData = await titleRes.json();
          const title = titleData.choices?.[0]?.message?.content?.trim() || 'Nouvelle conversation';
          await fetch(`${DB}/sessions?id=eq.${session_id}`, { method: 'PATCH', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify({ title }) });
        }
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch(e) {
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      res.end();
    }
  }
});

app.post('/api/chat/temp', async (req, res) => {
  try {
    const { message, history = [], model, temperature = 0.7 } = req.body;
    const messages = [SYSTEM, ...history, { role: 'user', content: message }];
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: MODELS[model] || "llama-3.3-70b-versatile", messages, temperature: parseFloat(temperature) }) });
    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content || "Erreur" });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const transResp = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: `Translate to English, reply with ONLY the English words: "${prompt}"` }], max_tokens: 100 }) });
    const transData = await transResp.json();
    const englishPrompt = transData.choices?.[0]?.message?.content?.trim() || prompt;
    const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", { method: "POST", headers: { "Authorization": `Bearer ${process.env.STABILITY_KEY}`, "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify({ text_prompts: [{ text: englishPrompt, weight: 1 }], cfg_scale: 7, height: 1024, width: 1024, samples: 1, steps: 20 }) });
    const data = await response.json();
    if (!data.artifacts?.[0]?.base64) return res.status(500).json({ error: 'Image non generee' });
    res.json({ url: `data:image/png;base64,${data.artifacts[0].base64}` });
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

app.post('/api/analyze', async (req, res) => {
  try {
    const { imageUrl, question } = req.body;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "meta-llama/llama-4-scout-17b-16e-instruct", messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: imageUrl } }, { type: "text", text: question || "Décris cette image en détail." }] }] }) });
    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content || "Impossible d'analyser." });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    const r = await fetch(`${DB}/sessions?user_id=eq.${String(user.id)}&order=created_at.desc`, { headers: SB });
    const data = await r.json();
    res.json(Array.isArray(data) ? data : []);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { token, title } = req.body;
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    const r = await fetch(`${DB}/sessions`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=representation' }, body: JSON.stringify({ user_id: String(user.id), title: title || 'Nouvelle conversation' }) });
    const data = await r.json();
    res.json(data[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    await fetch(`${DB}/conversations?session_id=eq.${req.params.id}`, { method: 'DELETE', headers: SB });
    await fetch(`${DB}/sessions?id=eq.${req.params.id}&user_id=eq.${String(user.id)}`, { method: 'DELETE', headers: SB });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/sessions/:id', async (req, res) => {
  try {
    const { token, title } = req.body;
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    await fetch(`${DB}/sessions?id=eq.${req.params.id}&user_id=eq.${String(user.id)}`, { method: 'PATCH', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify({ title }) });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/sessions/:id/pin', async (req, res) => {
  try {
    const { token, pinned } = req.body;
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    await fetch(`${DB}/sessions?id=eq.${req.params.id}&user_id=eq.${String(user.id)}`, { method: 'PATCH', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify({ pinned }) });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/history/:sessionId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    const r = await fetch(`${DB}/conversations?user_id=eq.${String(user.id)}&session_id=eq.${req.params.sessionId}&order=created_at.asc&limit=50`, { headers: SB });
    const data = await r.json();
    res.json(Array.isArray(data) ? data : []);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/memory', async (req, res) => {
  try {
    const { token } = req.body;
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    await fetch(`${DB}/conversations?user_id=eq.${String(user.id)}`, { method: 'DELETE', headers: SB });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/memory/view', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    const r = await fetch(`${DB}/users?id=eq.${user.id}&select=name,email,instructions,created_at`, { headers: SB });
    const data = await r.json();
    res.json(Array.isArray(data) ? data[0] : {});
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/profile', async (req, res) => {
  try {
    const { token, name, password } = req.body;
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    const updates = {};
    if (name) updates.name = name;
    if (password) updates.password = hashPwd(password);
    await fetch(`${DB}/users?id=eq.${user.id}`, { method: 'PATCH', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify(updates) });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/instructions', async (req, res) => {
  try {
    const { token, instructions } = req.body;
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    await fetch(`${DB}/users?id=eq.${user.id}`, { method: 'PATCH', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify({ instructions }) });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/account', async (req, res) => {
  try {
    const { token } = req.body;
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    await fetch(`${DB}/conversations?user_id=eq.${String(user.id)}`, { method: 'DELETE', headers: SB });
    await fetch(`${DB}/sessions?user_id=eq.${String(user.id)}`, { method: 'DELETE', headers: SB });
    await fetch(`${DB}/users?id=eq.${user.id}`, { method: 'DELETE', headers: SB });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/export/:sessionId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    const r = await fetch(`${DB}/conversations?user_id=eq.${String(user.id)}&session_id=eq.${req.params.sessionId}&order=created_at.asc`, { headers: SB });
    const data = await r.json();
    let text = 'Conversation Guideon\n\n';
    if (Array.isArray(data)) data.forEach(m => { text += (m.role === 'user' ? 'Vous: ' : 'Guideon: ') + m.content + '\n\n'; });
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=conversation.txt');
    res.send(text);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/share/:sessionId', async (req, res) => {
  try {
    const r = await fetch(`${DB}/conversations?session_id=eq.${req.params.sessionId}&order=created_at.asc`, { headers: SB });
    const data = await r.json();
    res.json(Array.isArray(data) ? data : []);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/search/history', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    const q = req.query.q;
    const r = await fetch(`${DB}/conversations?user_id=eq.${String(user.id)}&content=ilike.*${encodeURIComponent(q)}*&order=pinned.desc,created_at.desc&limit=20`, { headers: SB });
    const data = await r.json();
    res.json(Array.isArray(data) ? data : []);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/regenerate', async (req, res) => {
  try {
    const { token, session_id } = req.body;
    const user = checkToken(token);
    if (!user) return res.status(401).json({ error: 'Non autorise' });
    const r = await fetch(`${DB}/conversations?user_id=eq.${String(user.id)}&session_id=eq.${session_id}&order=pinned.desc,created_at.desc&limit=2`, { headers: SB });
    const data = await r.json();
    if (Array.isArray(data)) for (const msg of data) await fetch(`${DB}/conversations?id=eq.${msg.id}`, { method: 'DELETE', headers: SB });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/models', (req, res) => { res.json(Object.keys(MODELS)); });


app.post('/api/feedback', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = checkToken(token);
    const { message, rating } = req.body;
    if (user && DB) {
      await fetch(`${DB}/feedback`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify({ user_id: String(user.id), message, rating }) });
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.listen(process.env.PORT || 3000, () => console.log("Guideon actif !"));
