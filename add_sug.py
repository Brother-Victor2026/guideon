with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

# 1. Add the helper functions (insert before "function sm()")
helper = """function useSug(t){document.getElementById('ui').value=t;sm();}
function addSug(){const chat=document.getElementById('chat');const d=document.createElement('div');d.className='sug';d.innerHTML='<button onclick="useSug(this.textContent)">Aide-moi a rediger un email</button><button onclick="useSug(this.textContent)">Donne-moi une idee de recette</button><button onclick="useSug(this.textContent)">Explique-moi un concept simplement</button><button onclick="useSug(this.textContent)">Quelle est la meteo aujourd\\'hui ?</button>';chat.appendChild(d);}
"""

old_marker = "async function sm()"
n = c.count(old_marker)
print('sm() found:', n)
content = c.replace(old_marker, helper + old_marker, 1)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
