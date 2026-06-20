h = open('public/index.html', encoding='utf-8').read()

# D: transmettre image_url a am() - marqueur exact sans espaces
mD = "data.forEach(m=>am(m.role==='assistant'?'guideon':'user',m.content));"
idxD = h.find(mD)
print('idxD=', idxD)
if idxD != -1:
    h = h.replace(mD, "data.forEach(m=>am(m.role==='assistant'?'guideon':'user',m.content,m.image_url));", 1)
    print('Edit D OK')
else:
    print('ERREUR D toujours introuvable')

# E partie 1 : retirer l'assignation window.__lastErr dans le catch
idx_console = h.find("console.error('SSE err',e,dd);")
idx_close = h.find("}}if(!el)", idx_console) if idx_console != -1 else -1
print('idx_console=', idx_console, 'idx_close=', idx_close)
if idx_console != -1 and idx_close != -1 and idx_close > idx_console:
    remove_start = idx_console + len("console.error('SSE err',e,dd);")
    h = h[:remove_start] + h[idx_close:]
    print('Edit E1 OK (window.__lastErr retire)')
else:
    print('ERREUR E1: marqueurs introuvables')

# E partie 2 : simplifier le texte affiche en cas de reponse vide
idx_debug = h.find("(reponse vide) [DEBUG:")
print('idx_debug=', idx_debug)
if idx_debug != -1:
    start_idx = h.rfind("if(!el){el=am(", 0, idx_debug)
    end_idx = h.find("}else{", idx_debug)
    print('start_idx=', start_idx, 'end_idx=', end_idx)
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        end_idx_inclusive = end_idx + 1  # inclure le '}' avant else
        new_block = "if(!el){el=am('guideon',full||'(reponse vide)')}"
        h = h[:start_idx] + new_block + h[end_idx_inclusive:]
        print('Edit E2 OK (texte debug simplifie)')
    else:
        print('ERREUR E2: bornes introuvables')
else:
    print('ERREUR E2: deja absent ou introuvable')

open('public/index.html', 'w', encoding='utf-8').write(h)
print('index.html ecrit')
