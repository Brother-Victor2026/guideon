with open('server.mjs', 'r', encoding='utf-8') as f:
    c = f.read()

# Remplacer l'insertion simultanee par une insertion sequentielle
old = """        const convRes = await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify([
            { user_id: String(user.id), role: 'user', content: message, session_id, image_url: null },
            { user_id: String(user.id), role: 'assistant', content: reply, session_id, image_url: savedImageUrl }
          ])});"""
new = """        await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify([{ user_id: String(user.id), role: 'user', content: message, session_id, image_url: null }])});
        const convRes = await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify([{ user_id: String(user.id), role: 'assistant', content: reply, session_id, image_url: savedImageUrl }])});"""

count = c.count(old)
print('occurrences:', count)
if count == 1:
    c = c.replace(old, new)
    with open('server.mjs', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: insertion sequentielle user puis assistant')
else:
    print('ERREUR: chaine non trouvee')
