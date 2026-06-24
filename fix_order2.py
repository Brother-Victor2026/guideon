with open('server.mjs', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Chercher la ligne contenant l'insertion simultanee user+assistant
start = -1
end = -1
for i, line in enumerate(lines):
    if "user_id: String(user.id), role: 'user', content: message" in line and start == -1:
        # Remonter pour trouver le debut du fetch
        for j in range(i, max(0, i-5), -1):
            if 'convRes' in lines[j] and 'fetch' in lines[j]:
                start = j
                break
    if start != -1 and '])}' in line and end == -1 and i > start:
        end = i
        break

print('start:', start+1 if start != -1 else 'non trouve')
print('end:', end+1 if end != -1 else 'non trouve')

if start != -1 and end != -1:
    user_id_line = None
    for i in range(start, end+1):
        if "role: 'user'" in lines[i]:
            user_id_str = lines[i].strip().rstrip(',')
            break
    
    # Remplacer le bloc par deux insertions sequentielles
    indent = '        '
    new_lines = [
        indent + "await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify([{ user_id: String(user.id), role: 'user', content: message, session_id, image_url: null }])});\n",
        indent + "const convRes = await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify([{ user_id: String(user.id), role: 'assistant', content: reply, session_id, image_url: savedImageUrl }])});\n"
    ]
    lines[start:end+1] = new_lines
    with open('server.mjs', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('OK: insertion sequentielle user puis assistant')
else:
    print('ERREUR: bloc non trouve')
