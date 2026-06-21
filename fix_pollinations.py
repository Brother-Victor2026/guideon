import sys

path = "server.mjs"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "async function callStabilityAI(rawPrompt) {"
start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERREUR: debut de fonction introuvable, abandon.")
    sys.exit(1)

end_marker = "console.error('HuggingFace exception:', e.message, e.cause);\n    return null;\n  }\n}"
end_search_idx = content.find(end_marker, start_idx)
if end_search_idx == -1:
    print("ERREUR: fin de fonction introuvable, abandon.")
    sys.exit(1)

end_idx = end_search_idx + len(end_marker)

old_function = content[start_idx:end_idx]

new_function = """async function callStabilityAI(rawPrompt) {
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
    console.error('Pollinations reponse OK, content-type:', contentType);
    const arrayBuffer = await imgResp.arrayBuffer();
    console.error('Pollinations taille image (bytes):', arrayBuffer.byteLength);
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    console.error('Pollinations base64 genere, longueur:', base64.length);
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    console.error('Pollinations exception:', e.message, e.cause);
    return null;
  }
}"""

content = content[:start_idx] + new_function + content[end_idx:]

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK - fonction callStabilityAI basculee vers Pollinations.ai.")
print(f"Ancienne fonction ({len(old_function)} caracteres) remplacee.")
