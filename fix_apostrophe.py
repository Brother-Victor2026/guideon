c = open('server.mjs', encoding='utf-8').read()
old = "'\u00e0 quoi \u00e7a a l'air'"
new = "'\u00e0 quoi \u00e7a a l\\'air'"
count = c.count(old)
print('occurrences:', count)
if count == 1:
    c = c.replace(old, new)
    open('server.mjs', 'w', encoding='utf-8').write(c)
    print('Fix apostrophe OK')
else:
    print('ABORT: occurrences inattendues')
