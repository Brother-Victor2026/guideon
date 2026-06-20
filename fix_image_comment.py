c = open('server.mjs', encoding='utf-8').read()

old = "res.json({ url: imgUrl });"
new = """let comment = 'Voici votre image !';
    try {
      const commentResp = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: `Ecris une phrase courte et chaleureuse en francais (une seule phrase) pour presenter une image generee a partir de cette description, puis une question de relance courte pour continuer la conversation. Description: "${englishPrompt}". Reponds uniquement avec la phrase et la question, sans guillemets, sans markdown.` }], max_tokens: 80 }) });
      const commentData = await commentResp.json();
      comment = commentData.choices?.[0]?.message?.content?.trim() || comment;
    } catch (e) {}
    res.json({ url: imgUrl, comment });"""

count = c.count(old)
print('occurrences:', count)
if count == 1:
    c = c.replace(old, new)
    open('server.mjs', 'w', encoding='utf-8').write(c)
    print('Fix commentaire image applique avec succes')
else:
    print('ABORT: occurrences inattendues')
