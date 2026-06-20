import sys

path = "server.mjs"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_segment = "if (!convRes.ok) { console.error('ERREUR insertion conversations:', convRes.status, await convRes.text()); } else { console.log('Insertion conversations OK'); }"
new_segment = "if (!convRes.ok) { console.error('ERREUR insertion conversations:', convRes.status, await convRes.text()); }"

count = content.count(old_segment)
if count != 1:
    print(f"ERREUR: occurrence inattendue ({count}), abandon.")
    sys.exit(1)

content = content.replace(old_segment, new_segment)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK - log de succes retire, log d'erreur conserve.")
