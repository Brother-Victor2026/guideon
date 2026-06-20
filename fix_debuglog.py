import sys

path = "server.mjs"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Étape 1: capturer la réponse du fetch dans une variable
old1 = "await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify(["
new1 = "const convRes = await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify(["

count1 = content.count(old1)
if count1 != 1:
    print(f"ERREUR étape 1: occurrence inattendue ({count1}), abandon.")
    sys.exit(1)
content = content.replace(old1, new1)

# Étape 2: insérer le log d'erreur juste après l'insertion (après le marqueur image_url)
marker = "role: 'assistant', content: reply, session_id, image_url: savedImageUrl }"
idx = content.find(marker)
if idx == -1:
    print("ERREUR étape 2: marqueur introuvable, abandon.")
    sys.exit(1)

# Trouver la fin du statement: la prochaine occurrence de "});" après le marqueur
end_marker = "])});"
end_idx = content.find(end_marker, idx)
if end_idx == -1:
    print("ERREUR étape 2: fin de statement introuvable, abandon.")
    sys.exit(1)

insert_pos = end_idx + len(end_marker)
log_line = "\n    if (!convRes.ok) { console.error('ERREUR insertion conversations:', convRes.status, await convRes.text()); } else { console.log('Insertion conversations OK'); }"

content = content[:insert_pos] + log_line + content[insert_pos:]

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK - log de diagnostic ajouté.")
