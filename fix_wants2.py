with open('server.mjs', 'r', encoding='utf-8') as f:
    c = f.read()

old = '                if (desc) {\n                    try {\n                        const imgUrl = await callStabilityAI(desc);'
new = '                if (desc && wantsVisual) {\n                    try {\n                        const imgUrl = await callStabilityAI(desc);'

count = c.count(old)
print('occurrences:', count)
if count == 1:
    c = c.replace(old, new)
    with open('server.mjs', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: wantsVisual guard ajoute')
else:
    print('ERREUR: chaine non trouvee')
