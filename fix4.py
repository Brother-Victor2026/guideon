with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

old4 = "m=>am(m.role==='assistant'?'guideon':m.role,m.content,m.image_url)"
new4 = "m=>am(m.role==='assistant'?'guideon':m.role,m.content,m.image_url,m.created_at)"
if old4 in c:
    c = c.replace(old4, new4)
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('Fix 4 OK: m.created_at passe')
else:
    print('ERREUR Fix 4: chaine non trouvee')
