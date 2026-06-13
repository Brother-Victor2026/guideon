import re

with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

m = re.search(r"function addSug\(\)\{.*?\n", c)
old_full = m.group()

buttons = [
    ("Crée une image d'un paysage de montagne au coucher du soleil", "\U0001F3A8"),
    ("Résume ce texte que je vais te coller", "\U0001F4DD"),
    ("Donne-moi des conseils pour mieux gérer mon temps", "\U0001F393"),
    ("Aide-moi à élaborer un plan pour organiser mon projet", "\U0001F4A1"),
    ("Aide-moi à rédiger un email professionnel", "\u270D\uFE0F"),
    ("Aide-moi à analyser ces données", "\U0001F4CA"),
    ("Propose-moi des idées créatives pour ce week-end", "\U0001F52E"),
    ("Surprends-moi avec une anecdote intéressante", "\U0001F381"),
    ("Analyse cette image que je vais t'envoyer", "\U0001F441\uFE0F"),
]

html_parts = ""
for text, icon in buttons:
    # Use HTML entity for apostrophe to avoid quote issues entirely
    text_html = text.replace("'", "&#39;")
    html_parts += '<button onclick="useSug(this.dataset.t)" data-t="' + text_html + '">' + icon + " " + text_html + "</button>"

new_full = "function addSug(){const chat=document.getElementById('chat');const d=document.createElement('div');d.className='sug';d.innerHTML='" + html_parts + "';chat.appendChild(d);}\n"

content = c.replace(old_full, new_full, 1)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
