import re

with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

# Remove old onend (without clearInterval) and old onerror right after it
pattern = re.compile(r"u\.onend=function\(\)\{btn\.textContent='[^']*';bub\.innerHTML=bub\.dataset\.orig;\}u\.onerror=function\(\)\{btn\.textContent='[^']*';bub\.innerHTML=bub\.dataset\.orig;\}")
n = len(pattern.findall(c))
print('Found:', n)
content = pattern.sub("", c, count=1)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
