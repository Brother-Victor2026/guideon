with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

old = ".ty span:nth-child(2){animation-delay:0.2s}.ty span:nth-child(3){animation-delay:0.4s}"

new = old + ".tts-w{transition:background 0.15s ease}.tts-active{background:#a78bfa;border-radius:3px;color:#1a0533}"

n = c.count(old)
content = c.replace(old, new, 1)
print('Found:', n)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
