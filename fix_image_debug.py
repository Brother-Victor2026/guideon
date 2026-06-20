content = open('public/index.html', encoding='utf-8').read()
old = "catch(e){}}if(!el){el=am('guideon',full||'(reponse vide)')}"
new = "catch(e){console.error('SSE err',e,dd);window.__lastErr=(e&&e.message||'')+' | '+dd.slice(0,300)}}if(!el){el=am('guideon',full||('(reponse vide) [DEBUG: '+(window.__lastErr||'aucune erreur, el jamais cree')+']'))}"
count = content.count(old)
print('occurrences trouvees:', count)
if count == 1:
    content = content.replace(old, new)
    open('public/index.html', 'w', encoding='utf-8').write(content)
    print('Remplacement effectue avec succes')
else:
    print('ABORT: pas exactement 1 occurrence, rien modifie')
