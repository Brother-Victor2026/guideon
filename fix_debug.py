with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Trouve le fetch de switchSession (unique dans le fichier)
anchor = "fetch('/api/history/'+id"
pos = c.find(anchor)
if pos < 0:
    print('ERREUR: anchor fetch non trouve')
    exit()

# Trouve le const data=await r.json(); apres ce fetch
target = "const data=await r.json();"
tpos = c.find(target, pos)
if tpos < 0:
    print('ERREUR: data decl non trouvee. Contexte:', repr(c[pos:pos+300]))
    exit()

ins = tpos + len(target)
dbg = ("const _dbg=document.createElement('div');"
       "_dbg.style='position:fixed;top:0;left:0;right:0;background:rgba(0,50,200,0.93);color:#fff;font-size:11px;z-index:9999;padding:6px;word-break:break-all';"
       "_dbg.textContent='[DBG] isArr:'+Array.isArray(data)+' len:'+(Array.isArray(data)?data.length:'N/A')+' | '+JSON.stringify(Array.isArray(data)?data[0]||'vide':data).slice(0,300);"
       "document.body.appendChild(_dbg);setTimeout(()=>{try{_dbg.remove()}catch(e){}},25000);")

c = c[:ins] + dbg + c[ins:]
with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK: debug overlay ajoute (visible 25s apres refresh)')
