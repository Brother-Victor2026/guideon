import sys

path = "server.mjs"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = "headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': contentType },"
new = "headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Content-Type': contentType },"

count = content.count(old)
if count != 1:
    print(f"ERREUR: occurrence inattendue ({count}), abandon.")
    sys.exit(1)

content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK - en-tete Authorization retire, seul apikey est envoye desormais.")
