import express from "express";
import Groq from "groq-sdk";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_user_id ON conversations(user_id);
  `);
  console.log("Base de données prête.");
}

async function getHistory(userId) {
  const { rows } = await pool.query(
    `SELECT role, content FROM conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 40`,
    [userId]
  );
  return rows.reverse();
}

async function saveMessage(userId, role, content) {
  await pool.query(
    `INSERT INTO conversations (user_id, role, content) VALUES ($1, $2, $3)`,
    [userId, role, content]
  );
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/chat", async (req, res) => {
  const { message, userId } = req.body;
  if (!message || !userId) return res.status(400).json({ error: "message et userId requis." });
  try {
    const history = await getHistory(userId);
    await saveMessage(userId, "user", message);
    const messages = [
      { role: "system", content: "Tu es Guidéon, un assistant IA créé par Brother Victor Bossou. Tu es intelligent et bienveillant. Tu te souviens de toutes les conversations passées." },
      ...history,
      { role: "user", content: message },
    ];
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      stream: true,
      max_tokens: 1024,
    });
    let fullResponse = "";
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || "";
      if (token) {
        fullResponse += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }
    await saveMessage(userId, "assistant", fullResponse);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Erreur:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.get("/history/:userId", async (req, res) => {
  try {
    const history = await getHistory(req.params.userId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Erreur." });
  }
});

app.delete("/history/:userId", async (req, res) => {
  try {
    await pool.query(`DELETE FROM conversations WHERE user_id = $1`, [req.params.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur." });
  }
});

const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`Guidéon sur le port ${PORT}`));
});
