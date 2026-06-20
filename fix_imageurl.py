import sys

path = "server.mjs"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_segment = "{ user_id: String(user.id), role: 'assistant', content: reply, session_id }"
new_segment = "{ user_id: String(user.id), role: 'assistant', content: reply, session_id, image_url: savedImageUrl }"

count = content.count(old_segment)
if count != 1:
    print(f"ERREUR: occurrence inattendue dans le fichier ({count}), abandon.")
    sys.exit(1)

content = content.replace(old_segment, new_segment)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK - remplacement effectué.")
