import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const API_KEY = process.env.GROQ_API_KEY;
const DOSSIER_USERS = "./users";
const DOSSIER_IMAGES = "./images";

[DOSSIER_USERS, DOSSIER_IMAGES].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const C = {
  reset:'\x1b[0m', bold:'\x1b[1m', cyan:'\x1b[96m',
  magenta:'\x1b[95m', yellow:'\x1b[93m', green:'\x1b[92m',
  blue:'\x1b[94m', red:'\x1b[91m', gray:'\x1b[90m', white:'\x1b[97m',
};

const PERSONNALITE = {
  role: "system",
  content: `Tu es Guidéon, un assistant virtuel sage et philosophique.
- Tu réponds dans la même langue que l'utilisateur (français par défaut)
- Tu es calme, réfléchi, profond et bienveillant
- Tu utilises des métaphores poétiques pour expliquer les choses
- Tu peux citer des philosophes quand c'est pertinent
- Ton nom est Guidéon, tu en es fier
- Tu ne révèles jamais que tu utilises une IA externe
- Quand on te donne un contexte web ou fichier, utilise-le pour répondre`
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let history = [];
let currentUser = "default";
let ttsActif = false;

function getUserFile(user) {
  return path.join(DOSSIER_USERS, `${user}.json`);
}

function chargerHistorique(user) {
  try {
    const file = getUserFile(user);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      console.log(`${C.green}📂 ${data.length} messages chargés pour "${user}".${C.reset}`);
      return data;
    }
  } catch(e) {}
  return [];
}

function sauvegarder() {
  fs.writeFileSync(getUserFile(currentUser), JSON.stringify(history, null, 2));
}

async function parler(texte) {
  try {
    const propre = texte.replace(/[\"\'`]/g, '').substring(0, 200);
    await execAsync(`termux-tts-speak "${propre}"`);
  } catch(e) {
    console.log(`${C.red}❌ Synthèse vocale indisponible${C.reset}`);
  }
}

async function rechercherWeb(query) {
  try {
    process.stdout.write(`${C.yellow}🌐 Recherche web...${C.reset}     \r`);
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.AbstractText) return data.AbstractText;
    if (data.Answer) return data.Answer;
    if (data.RelatedTopics?.[0]?.Text) return data.RelatedTopics[0].Text;
    return null;
  } catch(e) { return null; }
}

async function appelGroq(messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages })
  });
  const data = await res.json();
  if (!data.choices) throw new Error(JSON.stringify(data));
  return data.choices[0].message.content;
}

async function chat(message, contexte = null) {
  let contenu = message;
  if (contexte) contenu = `[Contexte: ${contexte}]\n\nDemande: ${message}`;
  history.push({ role: "user", content: contenu });
  process.stdout.write(`\n${C.yellow}⏳ Guidéon réfléchit...${C.reset}          \r`);
  try {
    const reply = await appelGroq([PERSONNALITE, ...history]);
    history.push({ role: "assistant", content: reply });
    sauvegarder();
    return reply;
  } catch(e) {
    history.pop();
    console.log(`\n${C.red}❌ Erreur: ${e.message}${C.reset}\n`);
    return null;
  }
}

async function genererImage(prompt) {
  try {
    process.stdout.write(`${C.yellow}🎨 Génération image...${C.reset}     \r`);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512`;
    const filename = `image_${Date.now()}.jpg`;
    const filepath = path.join(DOSSIER_IMAGES, filename);
    await execAsync(`curl -sL "${url}" -o "${filepath}"`);
    return filepath;
  } catch(e) { return null; }
}

async function lireFichier(filepath) {
  try {
    if (!fs.existsSync(filepath)) return null;
    if (filepath.endsWith('.pdf')) {
      const { default: pdfParse } = await import('pdf-parse');
      const buffer = fs.readFileSync(filepath);
      const data = await pdfParse(buffer);
      return data.text.substring(0, 3000);
    }
    return fs.readFileSync(filepath, 'utf8').substring(0, 3000);
  } catch(e) { return null; }
}

function showBanner() {
  console.clear();
  console.log(`\n${C.bold}${C.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`${C.bold}${C.magenta}   🧠  Bienvenue chez Guidéon !   ${C.reset}`);
  console.log(`${C.bold}${C.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`${C.green}   Assistant sage et philosophique 😊${C.reset}\n`);
}

function showCommandes() {
  console.log(`${C.bold}${C.yellow}📋 COMMANDES :${C.reset}`);
  console.log(`${C.cyan}  !aide${C.reset}             — Cette liste`);
  console.log(`${C.cyan}  !user [nom]${C.reset}       — Changer d'utilisateur`);
  console.log(`${C.cyan}  !historique${C.reset}       — Voir l'historique`);
  console.log(`${C.cyan}  !vocal${C.reset}            — Activer/désactiver la voix`);
  console.log(`${C.cyan}  !web [question]${C.reset}   — Recherche internet`);
  console.log(`${C.cyan}  !effacer${C.reset}          — Effacer l'écran`);
  console.log(`${C.cyan}  !reset${C.reset}            — Nouvelle conversation`);
  console.log(`${C.cyan}  !quitter${C.reset}          — Quitter\n`);
  console.log(`${C.bold}${C.yellow}🔌 PLUGINS :${C.reset}`);
  console.log(`${C.magenta}  /traduire [texte]${C.reset}     — Traduire`);
  console.log(`${C.magenta}  /résume [texte]${C.reset}       — Résumer`);
  console.log(`${C.magenta}  /image [description]${C.reset}  — Générer image`);
  console.log(`${C.magenta}  /pdf [chemin]${C.reset}         — Lire un PDF`);
  console.log(`${C.magenta}  /fichier [chemin]${C.reset}     — Lire un fichier\n`);
}

async function ask() {
  const label = `${C.bold}${C.blue}[${currentUser}] ➤ ${C.reset}`;
  rl.question(label, async (input) => {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();
    if (!trimmed) { ask(); return; }

    if (lower === '!quitter') {
      console.log(`\n${C.magenta}🧠 Guidéon: La sagesse est de savoir quand s'arrêter. À bientôt ! 👋${C.reset}\n`);
      rl.close(); return;

    } else if (lower === '!aide') {
      showCommandes();

    } else if (lower === '!effacer') {
      showBanner(); showCommandes();

    } else if (lower === '!reset') {
      history = []; sauvegarder();
      console.log(`\n${C.green}✅ Conversation réinitialisée.${C.reset}\n`);

    } else if (lower === '!vocal') {
      ttsActif = !ttsActif;
      console.log(`\n${C.green}🔊 Voix ${ttsActif ? 'activée 🟢' : 'désactivée 🔴'}.${C.reset}\n`);

    } else if (lower.startsWith('!user ')) {
      currentUser = trimmed.substring(6).trim();
      history = chargerHistorique(currentUser);
      console.log(`\n${C.green}👤 Utilisateur changé: ${currentUser}${C.reset}\n`);

    } else if (lower === '!historique') {
      if (history.length === 0) {
        console.log(`\n${C.gray}📭 Aucun historique.${C.reset}\n`);
      } else {
        console.log(`\n${C.bold}${C.yellow}📜 Historique "${currentUser}" (${history.length} msgs):${C.reset}`);
        history.forEach(m => {
          const r = m.role === "user" ? `${C.blue}Vous${C.reset}` : `${C.magenta}Guidéon${C.reset}`;
          console.log(`${r}: ${m.content.substring(0, 80)}${m.content.length > 80 ? '...' : ''}`);
        });
        console.log();
      }

    } else if (lower.startsWith('!web ')) {
      const query = trimmed.substring(5);
      const resultat = await rechercherWeb(query);
      const reply = await chat(query, resultat || null);
      if (!resultat) console.log(`${C.gray}(Réponse depuis ma mémoire)${C.reset}`);
      if (reply) {
        console.log(`\n${C.bold}${C.magenta}🧠 Guidéon:${C.reset} ${C.white}${reply}${C.reset}\n`);
        if (ttsActif) await parler(reply);
      }

    } else if (lower.startsWith('/traduire ')) {
      const texte = trimmed.substring(10);
      const reply = await chat(`Traduis ce texte et indique la langue source et cible: "${texte}"`);
      if (reply) {
        console.log(`\n${C.bold}${C.magenta}🧠 Guidéon:${C.reset} ${C.white}${reply}${C.reset}\n`);
        if (ttsActif) await parler(reply);
      }

    } else if (lower.startsWith('/résume ')) {
      const texte = trimmed.substring(8);
      const reply = await chat(`Fais un résumé clair et structuré: "${texte}"`);
      if (reply) {
        console.log(`\n${C.bold}${C.magenta}🧠 Guidéon:${C.reset} ${C.white}${reply}${C.reset}\n`);
        if (ttsActif) await parler(reply);
      }

    } else if (lower.startsWith('/image ')) {
      const description = trimmed.substring(7);
      console.log(`\n${C.yellow}🎨 Génération en cours...${C.reset}`);
      const filepath = await genererImage(description);
      if (filepath) {
        console.log(`\n${C.green}✅ Image sauvegardée ici: ${filepath}${C.reset}\n`);
      } else {
        console.log(`\n${C.red}❌ Erreur génération image.${C.reset}\n`);
      }

    } else if (lower.startsWith('/pdf ')) {
      const filepath = trimmed.substring(5);
      console.log(`\n${C.yellow}📄 Lecture PDF...${C.reset}`);
      const texte = await lireFichier(filepath);
      if (texte) {
        const reply = await chat("Analyse ce PDF et donne un résumé détaillé", texte);
        if (reply) {
          console.log(`\n${C.bold}${C.magenta}🧠 Guidéon:${C.reset} ${C.white}${reply}${C.reset}\n`);
          if (ttsActif) await parler(reply);
        }
      } else {
        console.log(`\n${C.red}❌ PDF introuvable: ${filepath}${C.reset}\n`);
      }

    } else if (lower.startsWith('/fichier ')) {
      const filepath = trimmed.substring(9);
      const texte = await lireFichier(filepath);
      if (texte) {
        const reply = await chat("Analyse ce fichier et explique son contenu", texte);
        if (reply) {
          console.log(`\n${C.bold}${C.magenta}🧠 Guidéon:${C.reset} ${C.white}${reply}${C.reset}\n`);
          if (ttsActif) await parler(reply);
        }
      } else {
        console.log(`\n${C.red}❌ Fichier introuvable: ${filepath}${C.reset}\n`);
      }

    } else {
      const reply = await chat(trimmed);
      if (reply) {
        console.log(`\n${C.bold}${C.magenta}🧠 Guidéon:${C.reset} ${C.white}${reply}${C.reset}\n`);
        if (ttsActif) await parler(reply);
      }
    }
    ask();
  });
}

showBanner();
history = chargerHistorique(currentUser);
showCommandes();
ask();
