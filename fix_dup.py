with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

speaker = "\U0001F50A"

old = "u.onend=function(){btn.textContent='" + speaker + "';bub.innerHTML=bub.dataset.orig;};u.onerror=function(){btn.textContent='" + speaker + "';bub.innerHTML=bub.dataset.orig;};"

n = c.count(old)
print('Found:', n)
content = c.replace(old, "", 1)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
