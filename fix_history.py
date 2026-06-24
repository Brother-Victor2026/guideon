with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Apres le forEach qui affiche les messages, reconstruire chatHistory
old = ("if(Array.isArray(data)&&data.length>0)data.forEach(m=>am(m.role==='assistant'?'guideon':m.role,m.content,m.image_url,m.created_at));")
new = ("if(Array.isArray(data)&&data.length>0){data.forEach(m=>am(m.role==='assistant'?'guideon':m.role,m.content,m.image_url,m.created_at));"
       "chatHistory=data.filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content||''}));}")

if old in c:
    c = c.replace(old, new, 1)
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: chatHistory reconstruit depuis DB apres switchSession')
else:
    print('ERREUR: chaine non trouvee')
