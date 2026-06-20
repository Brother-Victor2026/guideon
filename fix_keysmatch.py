import sys

path = "server.mjs"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_segment = "{ user_id: String(user.id), role: 'user', content: message, session_id },"
new_segment = "{ user_id: String(user.id), role: 'user', content: message, session_id, image_url: null },"

count = content.count(old_segment)
if count != 1:
    print(f"ERREUR: occurrence inattendue ({count}), abandon.")
    sys.exit(1)

content = content.replace(old_segment, new_segment)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK - image_url: null ajouté à l'objet user.")
