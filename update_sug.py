with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

old_use = "function useSug(t){document.getElementById('ui').value=t;sm();}"
new_use = "function useSug(t){const ui=document.getElementById('ui');ui.value=t;ui.focus();ui.style.height='auto';ui.style.height=Math.min(ui.scrollHeight,120)+'px';}"
n1 = c.count(old_use)
print('useSug found:', n1)
content = c.replace(old_use, new_use, 1)

old_add_start = "function addSug(){const chat=document.getElementById('chat');const d=document.createElement('div');d.className='sug';d.innerHTML='"
old_add_end = "';chat.appendChild(d);}"

import re
m = re.search(re.escape(old_add_start) + ".*?" + re.escape(old_add_end), content, re.DOTALL)
print('addSug found:', bool(m))

buttons = [
    ("Crée une image d'un paysage de montagne au coucher du soleil", "\U0001F3A8"),
    ("Resume ce texte que je vais te coller", "\U0001F4DD"),
    ("Donne-moi des conseils pour mieux gerer mon temps", "\U0001F393"),
    ("Aide-moi a elaborer un plan pour organiser mon projet", "\U0001F4A1"),
    ("Aide-moi a rediger un email professionnel", "\u270D\uFE0F"),
    ("Aide-moi a analyser ces donnees", "\U0001F4CA"),
    ("Propose-moi des idees creatives pour ce week-end", "\U0001F52E"),
    ("Surprends-moi avec une anecdote interessante", "\U0001F381"),
    ("Analyse cette image que je vais t'envoyer", "\U0001F441\uFE0F"),
]

html_parts = ""
for text, icon in buttons:
    safe = text.replace("'", "\\'")
    html_parts += "<button onclick=\"useSug(\\'" + safe + "\\')\">" + icon + " " + text + "</button>"

new_add = old_add_start + html_parts + old_add_end
content = content[:m.start()] + new_add + content[m.end():]

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
