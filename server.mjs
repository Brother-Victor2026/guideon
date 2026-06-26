import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
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
  'gemma': 'llama-3.1-8b-instant'
};

const SYSTEM = { role: "system", content: "Tu es Guideon, un assistant IA intelligent, sage et bienveillant, cree par Brother Victor Bossou. Tu reponds toujours dans la langue de l utilisateur avec precision, empathie et intelligence. Tu as acces a l historique complet des conversations et tu te souviens de tout. Ne dis jamais que tu n as pas de memoire. Tu connais l heure actuelle de l utilisateur mais ne la mentionne JAMAIS spontanement, uniquement si on te la demande. Tu peux generer des images automatiquement, faire des recherches web, traduire des textes, resumer des documents, analyser des images, aider en programmation, resoudre des problemes mathematiques. Ne dis JAMAIS que tu ne peux pas faire ces choses. Tu reponds avec bienveillance et professionnalisme. Ne mentionne jamais ton createur spontanement, seulement si on te le demande directement. Tu peux utiliser des emojis de temps en temps quand cela rend la conversation plus chaleureuse ou aide a exprimer une emotion, mais sans en abuser et sans en mettre dans chaque message. Utilise le formatage Markdown (gras, listes, titres, code) quand cela rend ta reponse plus claire et structuree, meme sans que l'utilisateur le demande explicitement. Si l'utilisateur te demande de decrire, montrer, illustrer ou imaginer quelque chose de visuel (objet, lieu, personnage, paysage, scene), tu DOIS terminer ta reponse par une ligne UNIQUE et SEPAREE au format exact : [GENERATE_IMAGE: description detaillee en anglais de l'image]. Ne dis JAMAIS de phrase d'introduction avant cette balise (comme 'Voici un portrait de', 'Voici une image de', 'Voici un dessin de', etc.). La balise doit etre sur sa propre ligne, sans texte avant. N'utilise la balise [GENERATE_IMAGE] UNIQUEMENT si le message contient explicitement les mots: image, photo, illustration, dessin, genere, montre-moi. Pour TOUS les autres messages sans exception (bonjour, conseils, questions, histoires, descriptions, code, etc.), n'utilise JAMAIS cette balise. Ne dis jamais de phrase du type 'Voici un portrait de' ou similaire. Ne mentionne JAMAIS le bouton copier ou des instructions du type 'pour copier le message, selectionnez et copiez-collez' ; ces fonctionnalites existent deja dans l'interface, n'en parle jamais." };

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    const checkR = await fetch(`${DB}/users?email=eq.${encodeURIComponent(email)}`, { headers: SB });
    const checkData = await checkR.json();
    if (Array.isArray(checkData) && checkData.length > 0) return res.status(400).json({ error: 'Email deja utilise' });
    const SB_SERVICE = { 'apikey': process.env.SUPABASE_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
    const r = await fetch(`${DB}/users`, { method: 'POST', headers: SB_SERVICE, body: JSON.stringify({ email, password: hashPwd(password), name }) });
    const data = await r.json();
    if (!Array.isArray(data) || !data[0]) return res.status(400).json({ error: data.message || 'Erreur inscription' });
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
const COPY_PHRASE_START = '(Pour copier';
const WATCH_TAGS = [IMG_TAG_START, COPY_PHRASE_START];

function partialTagSuffixLength(s) {
  let best = 0;
  for (const tag of WATCH_TAGS) {
    const max = Math.min(s.length, tag.length);
    for (let len = max; len > 0; len--) {
      if (s.slice(-len).toLowerCase() === tag.slice(0, len).toLowerCase()) { if (len > best) best = len; break; }
    }
  }
  return best;
}

function findWatchTagStart(s) {
  let bestIdx = -1;
  for (const tag of WATCH_TAGS) {
    const idx = s.toLowerCase().indexOf(tag.toLowerCase());
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) bestIdx = idx;
  }
  return bestIdx;
}

async function callStabilityAI(rawPrompt) {
  try {
    const transResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: `Rewrite this as a short vivid visual scene description in English for an AI image generator. Do not use words like draw, generate, picture of, image of, illustration of - describe the subject and scene directly. Reply with ONLY the description, no quotes: "${rawPrompt}"` }], max_tokens: 150 })
    });
    const transData = await transResp.json();
    const englishPrompt = transData.choices?.[0]?.message?.content?.trim() || rawPrompt;
    console.error('Prompt envoye a Pollinations:', englishPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?width=1024&height=1024&nologo=true`;
    let imgResp;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      imgResp = await fetch(pollinationsUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!imgResp.ok) {
      const errText = await imgResp.text();
      console.error('Pollinations erreur:', imgResp.status, errText.slice(0, 300));
      return null;
    }
    const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await imgResp.arrayBuffer();
    console.error('Pollinations taille image (bytes):', arrayBuffer.byteLength);
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadResp = await fetch(`${SUPABASE_URL}/storage/v1/object/images/${filename}`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Content-Type': contentType },
      body: Buffer.from(arrayBuffer)
    });
    if (!uploadResp.ok) {
      const errText = await uploadResp.text();
      console.error('Erreur upload Supabase Storage:', uploadResp.status, errText.slice(0, 300));
      return null;
    }
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${filename}`;
    console.error('Image stockee sur Supabase Storage:', publicUrl);
    return publicUrl;
  } catch (e) {
    console.error('Pollinations exception:', e.message, e.cause);
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
          fetch(`${DB}/conversations?user_id=eq.${userId}&session_id=eq.${session_id}&order=id.asc&limit=30`, { headers: SB }),
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
    const visualWords = [
      'genere','genere-moi','éénere','éénere-moi',
      'dessine','dessine-moi',
      'illustre','illustre-moi',
      'montre','montre-moi',
      'affiche','affiche-moi',
      'envoie une image','envoie-moi une image',
      'represente','represente-moi','éépresente','éépresente-moi',
      'visualise','visualise-moi',
      'peins','dépeins','crée une image','crée-moi',
      'produis une image','imagine',
      'photo de','image de','portrait de','illustration de',
      'aperçu de','rendu de',
      'à quoi ressemble','ça ressemble à quoi','à quoi ça a l\'air',
      'décris visuellement',
      'représentation visuelle','rendu visuel','visualisation de'
    ];
    const wantsVisual = visualWords.some(w => message.toLowerCase().includes(w));
    const visualBoost = wantsVisual ? "\n\nIMPORTANT: la demande actuelle de l'utilisateur appelle "
      + "clairement un contenu visuel ou narratif. Tu DOIS terminer ta reponse par la balise "
      + "[GENERATE_IMAGE: description en anglais] decrivant ce qui a ete demande ou raconte." : '';
    // Charger memories utilisateur
  let memoriesText = '';
  try {
    const memRes = await fetch(`${DB}/memories?user_id=eq.${user.id}&order=updated_at.desc&limit=20`, { headers: SB });
    const mems = await memRes.json();
    if (Array.isArray(mems) && mems.length > 0) {
      memoriesText = '\n\nMEMOIRES SUR CET UTILISATEUR (infos retenues des conversations precedentes):\n' + mems.map(m => '- ' + m.content).join('\n');
    }
  } catch(e) { console.error('memories load error:', e.message); }

  const sysContent = SYSTEM.content + (userInstructions ? `\n\nInstructions: ${userInstructions}` : '') + (userTime && asksTime ? `\n\nL heure exacte est ${userTime}.` : '') + visualBoost + memoriesText;
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
  let imageDone = false;
  let savedImageUrl = null;

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
            while (fullMatch && !imageDone) {
              const before = pending.slice(0, fullMatch.index);
              if (before) res.write(`data: ${JSON.stringify({ content: before })}\n\n`);
              const desc = fullMatch[1].trim();
              if (desc && wantsVisual) {
                try {
                  const imgUrl = await callStabilityAI(desc);
                  if (imgUrl) res.write(`data: ${JSON.stringify({ image: imgUrl })}\n\n`);
              if (imgUrl) savedImageUrl = imgUrl;
                } catch (e) {}
              }
              imageDone = true;
              pending = pending.slice(fullMatch.index + fullMatch[0].length);
              fullMatch = pending.match(/\[GENERATE_IMAGE:\s*([\s\S]+?)\]/);
            }
            if (imageDone) pending = pending.replace(/\[GENERATE_IMAGE:\s*[\s\S]+?\]/g, '');
            let copyMatch = pending.match(/\(\s*pour copier le message[\s\S]{0,150}?copier[- ]coll[ée]r?[\s\S]{0,10}?\)/i);
            while (copyMatch) {
              const before = pending.slice(0, copyMatch.index);
              if (before) res.write(`data: ${JSON.stringify({ content: before })}\n\n`);
              pending = pending.slice(copyMatch.index + copyMatch[0].length);
              copyMatch = pending.match(/\(\s*pour copier le message[\s\S]{0,150}?copier[- ]coll[ée]r?[\s\S]{0,10}?\)/i);
            }
            const startIdx = findWatchTagStart(pending);
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
    reply = reply.replace(/\[GENERATE_IMAGE:\s*[\s\S]+?\]/g, '').replace(/^\s*true\s*$/m, '').trim();
    reply = reply.replace(/\(?\s*pour copier le message[\s\S]{0,150}?copier[- ]coll[ée]r?[\s\S]{0,10}?\)?/gi, '').trim();
    if (token && DB) {
      const user = checkToken(token);
      if (user) {
        const isFirst = dbHistory.length === 0;
        await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify([{ user_id: String(user.id), role: 'user', content: message, session_id, image_url: null }])});
        const convRes = await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify([{ user_id: String(user.id), role: 'assistant', content: reply, session_id, image_url: savedImageUrl }])});
    if (!convRes.ok) { console.error('ERREUR insertion conversations:', convRes.status, await convRes.text()); }
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
    // Extraire et sauvegarder memories en arriere-plan
    if (reply && user && user.id) {
      try {
        const extractRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 200,
            messages: [
              { role: 'system', content: 'Tu es un extracteur de memoires. Analyse la conversation et extrait UNIQUEMENT les faits importants sur l utilisateur (prenom, profession, preferences, habitudes, objectifs). Reponds avec une liste de faits courts, un par ligne, commencant par "-". Si aucun fait important, reponds "AUCUN".' },
              { role: 'user', content: `Message utilisateur: ${prompt}\nReponse assistant: ${reply}` }
            ]
          })
        });
        const extractData = await extractRes.json();
        const facts = extractData.choices?.[0]?.message?.content?.trim() || '';
        if (facts && facts !== 'AUCUN') {
          const lines = facts.split('\n').filter(l => l.startsWith('-')).map(l => l.slice(1).trim()).filter(Boolean);
          for (const fact of lines) {
            await fetch(`${DB}/memories`, {
              method: 'POST',
              headers: { ...SB, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ user_id: user.id, content: fact })
            });
          }
        }
      } catch(e) { console.error('memories save error:', e.message); }
    }
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
    const { prompt, token, session_id } = req.body;
    const transResp = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: `Translate to English, reply with ONLY the English words: "${prompt}"` }], max_tokens: 100 }) });
    const transData = await transResp.json();
    const englishPrompt = transData.choices?.[0]?.message?.content?.trim() || prompt;
    const imgUrl = await callStabilityAI(englishPrompt);
    if (!imgUrl) return res.status(500).json({ error: 'Image non generee' });
    let comment = 'Voici votre image !';
    try {
      const commentResp = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: `En une seule phrase tres courte en francais, presente cette image sans utiliser les mots 'Voici', 'portrait', 'illustration'. Description: "${englishPrompt}". Reponds uniquement avec la phrase, sans guillemets, sans markdown.` }], max_tokens: 80 }) });
      const commentData = await commentResp.json();
      comment = commentData.choices?.[0]?.message?.content?.trim() || comment;
    } catch (e) {}
    if (token && session_id && DB) {
      try {
        const user = checkToken(token);
        if (user) {
          await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify([
            { user_id: String(user.id), role: 'user', content: prompt, session_id, image_url: null },
            { user_id: String(user.id), role: 'assistant', content: comment, session_id, image_url: imgUrl }
          ])});
        }
      } catch (e) {}
    }
    res.json({ url: imgUrl, comment });
  } catch(e) { console.error('ERREUR /api/image:', e.message); res.status(500).json({ error: e.message }); }
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
    const r = await fetch(`${DB}/conversations?user_id=eq.${String(user.id)}&session_id=eq.${req.params.sessionId}&order=id.asc&limit=500`, { headers: SB });
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
    const r = await fetch(`${DB}/conversations?user_id=eq.${String(user.id)}&session_id=eq.${req.params.sessionId}&order=id.asc`, { headers: SB });
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
    const r = await fetch(`${DB}/conversations?session_id=eq.${req.params.sessionId}&order=id.asc`, { headers: SB });
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

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });
    const r = await fetch(`${DB}/users?email=eq.${encodeURIComponent(email)}`, { headers: SB });
    const users = await r.json();
    if (!Array.isArray(users) || !users[0]) return res.json({ message: 'Si cet email existe, un lien a été envoyé' });
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString();
    await fetch(`${DB}/users?email=eq.${encodeURIComponent(email)}`, { method: 'PATCH', headers: { ...SB, 'Content-Type': 'application/json' }, body: JSON.stringify({ reset_token: token, reset_expires: expires }) });
    const resetUrl = `${process.env.APP_URL || 'https://guideon-8h4m.onrender.com'}/reset-password?token=${token}`;
    await resend.emails.send({ from: 'Guidéon <onboarding@resend.dev>', to: email, subject: 'Réinitialisation de votre mot de passe Guidéon', html: `<p>Bonjour,</p><p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p><a href="${resetUrl}">${resetUrl}</a><p>Ce lien expire dans 1 heure.</p>` });
    res.json({ message: 'Si cet email existe, un lien a été envoyé' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/reset-password', (req, res) => {
  const token = req.query.token || '';
  const html = [
    '<!DOCTYPE html><html lang="fr"><head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>Reinitialisation - Guideon</title>',
    '<style>',
    '*{box-sizing:border-box;margin:0;padding:0}',
    'body{background:#0f0f1a;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}',
    '.card{background:#1a1a2e;border-radius:16px;padding:32px;width:90%;max-width:400px}',
    'h2{color:#a78bfa;margin-bottom:20px;text-align:center}',
    'input{width:100%;padding:12px;background:#0f0f1a;border:1px solid #2d1b69;border-radius:8px;color:#fff;font-size:14px;margin-bottom:12px}',
    'button{width:100%;padding:12px;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}',
    '#msg{color:#a78bfa;font-size:13px;margin-top:10px;text-align:center}',
    '</style></head><body>',
    '<div class="card">',
    '<h2>Nouveau mot de passe</h2>',
    '<input type="password" id="np" placeholder="Nouveau mot de passe">',
    '<input type="password" id="cp" placeholder="Confirmer le mot de passe">',
    '<button onclick="go()">Enregistrer</button>',
    '<button onclick="window.location.href=\'/\'">Annuler</button>',
    '<div id="msg"></div>',
    '</div>',
    '<script>',
    'var tok="' + token + '";',
    'async function go(){',
    'var np=document.getElementById("np").value;',
    'var cp=document.getElementById("cp").value;',
    'var msg=document.getElementById("msg");',
    'if(!np||np.length<6){msg.textContent="Minimum 6 caracteres.";return}',
    'if(np!==cp){msg.textContent="Les mots de passe ne correspondent pas.";return}',
    'var r=await fetch("/api/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:tok,password:np})});',
    'var d=await r.json();',
    'if(r.ok){msg.textContent="Mot de passe mis a jour. Redirection...";setTimeout(()=>window.location.href="/",2000);}',
    'else{msg.textContent=d.error||"Erreur.";}',
    '}',
    '<\/script>',
    '</body></html>'
  ].join('');
  res.send(html);
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token et mot de passe requis' });
    const r = await fetch(`${DB}/users?reset_token=eq.${token}`, { headers: SB });
    const users = await r.json();
    if (!Array.isArray(users) || !users[0]) return res.status(400).json({ error: 'Token invalide' });
    if (new Date(users[0].reset_expires) < new Date()) return res.status(400).json({ error: 'Token expiré' });
    await fetch(`${DB}/users?reset_token=eq.${token}`, { method: 'PATCH', headers: { ...SB, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: hashPwd(password), reset_token: null, reset_expires: null }) });
    res.json({ message: 'Mot de passe mis à jour' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
