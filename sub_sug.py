import re

with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

# Sub-suggestions data
subs = {
    "surprends": ["Anecdote insolite", "Citation inspirante du jour", "Question philosophique a mediter", "Fait scientifique etonnant"],
    "proposer": ["Idees d'activites pour ce week-end", "Idees de films a regarder ce soir", "Idees de cadeaux originaux", "Idees pour decorer mon espace"],
    "conseils": ["Mieux gerer mon temps", "Ameliorer ma productivite", "Gerer le stress au quotidien", "Economiser de l'argent"],
    "ecrire": ["Rediger un email professionnel", "Ecrire une lettre de motivation", "Corriger un texte", "Ecrire un poeme"],
    "plan": ["Organiser un projet", "Planifier un voyage", "Preparer un evenement", "Etablir un budget mensuel"],
}

# Build JS object literal for subs
def esc(s):
    return s.replace("'", "&#39;")

subs_js = "{"
for k, arr in subs.items():
    items = ",".join("'" + esc(x) + "'" for x in arr)
    subs_js += "'" + k + "':[" + items + "],"
subs_js += "}"

m = re.search(r"function addSug\(\)\{.*?\n", c)
old_full = m.group()

main_buttons = [
    ("Crée une image d'un paysage de montagne au coucher du soleil", "\U0001F3A8", None),
    ("Résume ce texte que je vais te coller", "\U0001F4DD", None),
    ("Conseils", "\U0001F393", "conseils"),
    ("Élaborer un plan", "\U0001F4A1", "plan"),
    ("M'aider à écrire", "\u270D\uFE0F", "ecrire"),
    ("Aide-moi à analyser ces données", "\U0001F4CA", None),
    ("Proposer des idées", "\U0001F52E", "proposer"),
    ("Surprends-moi", "\U0001F381", "surprends"),
    ("Analyse cette image que je vais t'envoyer", "\U0001F441\uFE0F", None),
]

html_parts = ""
for text, icon, key in main_buttons:
    text_html = esc(text)
    if key:
        html_parts += '<button onclick="showSubSug(' + "'" + key + "'" + ')">' + icon + " " + text_html + "</button>"
    else:
        html_parts += '<button onclick="useSug(this.dataset.t)" data-t="' + text_html + '">' + icon + " " + text_html + "</button>"

new_full = "const subSug=" + subs_js + ";\nfunction showSubSug(key){const chat=document.getElementById('chat');const old=chat.querySelector('.sug');if(old)old.remove();const d=document.createElement('div');d.className='sug';let h='<button onclick=\"addSug()\">\\u2190 Retour</button>';subSug[key].forEach(s=>{h+='<button onclick=\"useSug(this.dataset.t)\" data-t=\"'+s+'\">'+s+'</button>';});d.innerHTML=h;chat.appendChild(d);}\n" + "function addSug(){const chat=document.getElementById('chat');const old=chat.querySelector('.sug');if(old)old.remove();const d=document.createElement('div');d.className='sug';d.innerHTML='" + html_parts + "';chat.appendChild(d);}\n"

content = c.replace(old_full, new_full, 1)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
