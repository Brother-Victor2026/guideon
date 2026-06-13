import re

with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

pattern = re.compile(r"u\.onend=function\(\)\{btn\.textContent='[^']*';bub\.innerHTML=bub\.dataset\.orig;\};?u\.onerror=function\(\)\{btn\.textContent='[^']*';bub\.innerHTML=bub\.dataset\.orig;\};?")
matches = pattern.findall(c)
print('Found:', len(matches))
for mm in matches:
    print('---', repr(mm[:60]))

# Remove only matches that DON'T contain clearInterval (the old ones)
def repl(m):
    if 'clearInterval' in m.group():
        return m.group()
    return ''

content = pattern.sub(repl, c)
with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
