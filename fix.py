with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

fixes = 0

# Fix 1: null safety dans am() - evite crash si content est null
old1 = "marked.parse(content):content.replace(/\\n/g,'<br>')"
new1 = "marked.parse(content||''):(content||'').replace(/\\n/g,'<br>')"
if old1 in c:
    c = c.replace(old1, new1)
    fixes += 1
    print('Fix 1 OK: null safety am()')
else:
    print('ERREUR Fix 1: chaine non trouvee')

# Fix 2: expose le catch silencieux ligne 353 dans switchSession
lines = c.split('\n')
idx = 352  # ligne 353, index 0-base
if len(lines) > idx and '}catch(e){}' in lines[idx]:
    lines[idx] = lines[idx].replace(
        '}catch(e){}',
        '}catch(e){console.error("ERR switchSession:",e);}',
        1
    )
    c = '\n'.join(lines)
    fixes += 1
    print('Fix 2 OK: catch expose dans switchSession')
else:
    print('ERREUR Fix 2, ligne', idx+1, ':', repr(lines[idx][:80] if len(lines) > idx else 'N/A'))

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(str(fixes) + '/2 fixes appliques')
