import sys

path = "public/index.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

marker = 'Voici votre image !<br><img src="\'+imgData.url+\'"'
idx = content.find(marker)
if idx == -1:
    print("ERREUR: marker introuvable, fichier peut-être déjà modifié ou différent.")
    sys.exit(1)

line_start = content.rfind('\n', 0, idx) + 1
line_end = content.find('\n', idx)
line = content[line_start:line_end]

old_segment = "🎨 Voici votre image !"
new_segment = "🎨 '+(imgData.comment||'Voici votre image !')+'"

count = line.count(old_segment)
if count != 1:
    print(f"ERREUR: occurrence inattendue sur la ligne ({count}), abandon.")
    sys.exit(1)

new_line = line.replace(old_segment, new_segment)
content = content[:line_start] + new_line + content[line_end:]

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK - nouvelle ligne :")
print(repr(new_line))
