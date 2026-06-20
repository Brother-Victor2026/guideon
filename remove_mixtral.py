lines = open('server.mjs', encoding='utf-8').readlines()
new_lines = [l for l in lines if "'mixtral':" not in l]
removed = len(lines) - len(new_lines)
print('server.mjs: lignes supprimees =', removed)
if removed == 1:
    open('server.mjs', 'w', encoding='utf-8').writelines(new_lines)
    print('server.mjs mis a jour')
else:
    print('ABORT server.mjs: nombre inattendu, rien modifie')

lines2 = open('public/index.html', encoding='utf-8').readlines()
new_lines2 = [l for l in lines2 if 'value="mixtral"' not in l]
removed2 = len(lines2) - len(new_lines2)
print('index.html: lignes supprimees =', removed2)
if removed2 == 1:
    open('public/index.html', 'w', encoding='utf-8').writelines(new_lines2)
    print('index.html mis a jour')
else:
    print('ABORT index.html: nombre inattendu, rien modifie')
