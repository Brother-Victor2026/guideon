# Fix 1: server.mjs - limite 50 -> 500
with open('server.mjs', 'r', encoding='utf-8') as f:
    s = f.read()

old_s = '&order=created_at.asc&limit=50`'
new_s = '&order=created_at.asc&limit=500`'
count_s = s.count(old_s)
print('server.mjs occurrences:', count_s)
if count_s == 1:
    s = s.replace(old_s, new_s)
    with open('server.mjs', 'w', encoding='utf-8') as f:
        f.write(s)
    print('Fix 1 OK: limit 50 -> 500')
else:
    print('ERREUR Fix 1')

# Fix 2: index.html - supprime le debug overlay vert
with open('public/index.html', 'r', encoding='utf-8') as f:
    h = f.read()

old_h = ("const _imgs=Array.isArray(data)?data.filter(m=>m.image_url):[];"
         "const _dbg=document.createElement('div');"
         "_dbg.style='position:fixed;top:0;left:0;right:0;background:rgba(0,120,0,0.93);color:#fff;font-size:11px;z-index:9999;padding:6px;word-break:break-all';"
         "_dbg.textContent='[DBG] total:'+( Array.isArray(data)?data.length:'?')+' | avecImage:'+_imgs.length+' | '+(_imgs[0]?'url:'+(_imgs[0].image_url||'null').slice(0,80):'aucun image_url trouve');"
         "document.body.appendChild(_dbg);setTimeout(()=>{try{_dbg.remove()}catch(e){}},30000);")

count_h = h.count(old_h)
print('index.html debug occurrences:', count_h)
if count_h == 1:
    h = h.replace(old_h, '')
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.write(h)
    print('Fix 2 OK: debug supprime')
else:
    print('ERREUR Fix 2')
