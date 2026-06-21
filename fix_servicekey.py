import sys

path = "server.mjs"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Étape 1 : déclarer la nouvelle variable juste après SUPABASE_KEY
old1 = "const SUPABASE_KEY = process.env.SUPABASE_KEY;"
new1 = "const SUPABASE_KEY = process.env.SUPABASE_KEY;\nconst SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;"

count1 = content.count(old1)
if count1 != 1:
    print(f"ERREUR etape 1: occurrence inattendue ({count1}), abandon.")
    sys.exit(1)
content = content.replace(old1, new1)

# Étape 2 : utiliser la nouvelle clé pour l'upload Storage
old2 = "headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': contentType },"
new2 = "headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': contentType },"

count2 = content.count(old2)
if count2 != 1:
    print(f"ERREUR etape 2: occurrence inattendue ({count2}), abandon.")
    sys.exit(1)
content = content.replace(old2, new2)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK - upload Storage utilise maintenant SUPABASE_SERVICE_KEY.")
