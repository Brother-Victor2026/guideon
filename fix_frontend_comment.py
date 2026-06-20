h = open('public/index.html', encoding='utf-8').read()
old = "am('guideon','Voici votre image !',d.url);"
new = "am('guideon',d.comment||'Voici votre image !',d.url);"
count = h.count(old)
print('occurrences:', count)
if count == 1:
    h = h.replace(old, new)
    open('public/index.html', 'w', encoding='utf-8').write(h)
    print('Fix frontend applique avec succes')
else:
    print('ABORT: occurrences inattendues')
