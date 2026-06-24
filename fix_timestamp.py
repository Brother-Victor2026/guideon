with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

fixes = 0

# Fix 1: gt() accepte ts optionnel
old1 = "function gt(){return new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}"
new1 = "function gt(ts=null){return (ts?new Date(ts):new Date()).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}"
if old1 in c:
    c = c.replace(old1, new1)
    fixes += 1
    print('Fix 1 OK: gt() avec ts')
else:
    print('ERREUR Fix 1')

# Fix 2: am() signature
old2 = "function am(role,content,img=null){"
new2 = "function am(role,content,img=null,ts=null){"
if old2 in c:
    c = c.replace(old2, new2)
    fixes += 1
    print('Fix 2 OK: am() signature')
else:
    print('ERREUR Fix 2')

# Fix 3: gt() -> gt(ts) dans am()
old3 = "'+gt()+'"
new3 = "'+gt(ts)+'"
count3 = c.count(old3)
print('Fix 3 occurrences:', count3)
if count3 >= 1:
    c = c.replace(old3, new3)
    fixes += 1
    print('Fix 3 OK: gt(ts)')
else:
    print('ERREUR Fix 3')

# Fix 4: passer m.created_at dans switchSession
old4 = "m=>am(m.role=='assistant'?'guideon':m.role,m.content,m.image_url)"
new4 = "m=>am(m.role=='assistant'?'guideon':m.role,m.content,m.image_url,m.created_at)"
if old4 in c:
    c = c.replace(old4, new4)
    fixes += 1
    print('Fix 4 OK: m.created_at passe')
else:
    print('ERREUR Fix 4')

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(str(fixes) + '/4 fixes appliques')
