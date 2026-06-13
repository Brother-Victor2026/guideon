import re

with open('server.mjs', 'r') as f:
    content = f.read()

old1 = '''    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODELS[model] || "llama-3.3-70b-versatile", messages, temperature: parseFloat(temperature) || 0.7 })
    });
    const data = await response.json();
    if (!data.choices) return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    const reply = data.choices[0].message.content;'''

new1 = '''    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\\n');
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
            res.write(`data: ${JSON.stringify({ content })}\\n\\n`);
          }
        } catch (e) {}
      }
    }'''

if old1 not in content:
    print("ERREUR: bloc 1 non trouvé, aucune modification appliquée.")
    exit(1)

content = content.replace(old1, new1)

old2 = '''    res.json({ reply });
  } catch(e) { res.status(500).json({ error: e.message }); }
});'''

new2 = '''    res.write(`data: ${JSON.stringify({ done: true })}\\n\\n`);
    res.end();
  } catch(e) {
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: e.message })}\\n\\n`);
      res.end();
    }
  }
});'''

if old2 not in content:
    print("ERREUR: bloc 2 non trouvé, aucune modification appliquée.")
    exit(1)

content = content.replace(old2, new2)

with open('server.mjs', 'w') as f:
    f.write(content)

print("OK: server.mjs patché avec succès.")
