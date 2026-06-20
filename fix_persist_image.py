# ===== server.mjs =====
c = open('server.mjs', encoding='utf-8').read()

# A: declarer savedImageUrl
mA = "let imageDone = false;"
idxA = c.find(mA)
print('idxA=', idxA)
if idxA != -1:
    insert_at = idxA + len(mA)
    c = c[:insert_at] + "\n  let savedImageUrl = null;" + c[insert_at:]
    print('Edit A OK')

# B: capturer l'URL generee
mB = "if (imgUrl) res.write(`data: ${JSON.stringify({ image: imgUrl })}\\n\\n`);"
idxB = c.find(mB)
print('idxB=', idxB)
if idxB != -1:
    insert_at = idxB + len(mB)
    c = c[:insert_at] + "\n              if (imgUrl) savedImageUrl = imgUrl;" + c[insert_at:]
    print('Edit B OK')

# C: sauvegarder dans l'INSERT Supabase
mC = "{ user_id: String(user.id), role: 'assistant', content: reply, session_id }"
idxC = c.find(mC)
print('idxC=', idxC)
if idxC != -1:
    c = c[:idxC] + "{ user_id: String(user.id), role: 'assistant', content: reply, session_id, image_url: savedImageUrl }" + c[idxC+len(mC):]
    print('Edit C OK')

open('server.mjs', 'w', encoding='utf-8').write(c)
print('server.mjs ecrit')

# ===== public/index.html =====
h = open('public/index.html', encoding='utf-8').read()

# D: transmettre image_url a am()
mD = "data.forEach(m=>am(m.role==='assistant'?'guideon':'user', m.content));"
idxD = h.find(mD)
print('idxD=', idxD)
if idxD != -1:
    h = h.replace(mD, "data.forEach(m=>am(m.role==='assistant'?'guideon':'user', m.content, m.image_url));", 1)
    print('Edit D OK')

# E: nettoyer le debug overlay
mE_old = "catch(e){console.error('SSE err',e,dd);window.__lastErr=(e&&e.message||'')+' | '+dd.slice(0,300)}}if(!el){el=am('guideon',full||('(reponse vide) [DEBUG: '+(window.__lastErr||'aucune erreur, el jamais cree')+']'))}"
mE_new = "catch(e){console.error('SSE err',e,dd)}}if(!el){el=am('guideon',full||'(reponse vide)')}"
idxE = h.find(mE_old)
print('idxE=', idxE)
if idxE != -1:
    h = h.replace(mE_old, mE_new, 1)
    print('Edit E OK')
else:
    print('ERREUR E: marqueur introuvable, debug overlay non nettoye')

open('public/index.html', 'w', encoding='utf-8').write(h)
print('index.html ecrit')
