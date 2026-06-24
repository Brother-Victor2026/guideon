with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Remplace l'ancien debug par un nouveau centré sur les images
old = ("const _dbg=document.createElement('div');"
       "_dbg.style='position:fixed;top:0;left:0;right:0;background:rgba(0,50,200,0.93);color:#fff;font-size:11px;z-index:9999;padding:6px;word-break:break-all';"
       "_dbg.textContent='[DBG] isArr:'+Array.isArray(data)+' len:'+(Array.isArray(data)?data.length:'N/A')+' | '+JSON.stringify(Array.isArray(data)?data[0]||'vide':data).slice(0,300);"
       "document.body.appendChild(_dbg);setTimeout(()=>{try{_dbg.remove()}catch(e){}},25000);")

new = ("const _imgs=Array.isArray(data)?data.filter(m=>m.image_url):[];"
       "const _dbg=document.createElement('div');"
       "_dbg.style='position:fixed;top:0;left:0;right:0;background:rgba(0,120,0,0.93);color:#fff;font-size:11px;z-index:9999;padding:6px;word-break:break-all';"
       "_dbg.textContent='[DBG] total:'+( Array.isArray(data)?data.length:'?')+' | avecImage:'+_imgs.length+' | '+(_imgs[0]?'url:'+(_imgs[0].image_url||'null').slice(0,80):'aucun image_url trouve');"
       "document.body.appendChild(_dbg);setTimeout(()=>{try{_dbg.remove()}catch(e){}},30000);")

if old in c:
    c = c.replace(old, new, 1)
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: debug images')
else:
    print('ERREUR: ancien debug non trouve')
