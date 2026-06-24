with open('server.mjs', 'r', encoding='utf-8') as f:
    c = f.read()

old = 'if (desc) {\n                try {\n                    const imgUrl = await callStabilityAI(desc);'
new = 'if (desc && wantsVisual) {\n                try {\n                    const imgUrl = await callStabilityAI(desc);'

if old in c:
    c = c.replace(old, new, 1)
    with open('server.mjs', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: image bloquee si pas wantsVisual')
else:
    print('ERREUR: chaine non trouvee')
