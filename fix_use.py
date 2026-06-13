with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

old = "function useSug(t){const ui=document.getElementById('ui');ui.value=t;"
new = "function useSug(t){const ui=document.getElementById('ui');ui.value=t.replace(/&#39;/g,\"'\");"

n = c.count(old)
print('Found:', n)
content = c.replace(old, new, 1)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
