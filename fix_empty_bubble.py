h = open('public/index.html', encoding='utf-8').read()
old = "if(!el){rty();el=am('guideon',full||'(reponse vide)');}"
new = "if(!el){rty();if(full)el=am('guideon',full);}"
count = h.count(old)
print('occurrences:', count)
if count == 1:
    h = h.replace(old, new)
    open('public/index.html', 'w', encoding='utf-8').write(h)
    print('Fix bulle vide applique avec succes')
else:
    print('ABORT: occurrences inattendues')
