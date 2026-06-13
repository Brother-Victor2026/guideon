with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

# CSS - insert after .ty span rules
old_css = ".tts-w{transition:background 0.15s ease}.tts-active{background:#a78bfa;border-radius:3px;color:#1a0533}"
new_css = old_css + ".sug{display:flex;flex-wrap:wrap;gap:8px;padding:8px 16px;justify-content:center}.sug button{background:#1a0533;border:1px solid #2d1b69;color:#e2e8f0;border-radius:16px;padding:8px 14px;font-size:13px;cursor:pointer}.sug button:active{background:#2d1b69}"

n1 = c.count(old_css)
print('CSS found:', n1)
content = c.replace(old_css, new_css, 1)

# Add addSug() calls after each .wl innerHTML assignment
# 1. Initial page load (line 85 area)
old1 = "<h2>Bonjour ! Je suis votre assistant virtuel Guideon</h2><p>Que puis-je faire pour vous ?</p></div>"
n2 = content.count(old1)
print('Block1 found:', n2)

# We need to know how this block ends - is it directly set as innerHTML of #chat in initial render?
with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
