h = open('public/index.html', encoding='utf-8').read()
old = "data.forEach(m=>am(m.role==='assistant'?'guideon':m.role,m.content));"
new = "data.forEach(m=>am(m.role==='assistant'?'guideon':m.role,m.content,m.image_url));"
count = h.count(old)
print('occurrences:', count)
if count == 1:
    h = h.replace(old, new)
    open('public/index.html', 'w', encoding='utf-8').write(h)
    print('Edit D OK - ecrit')
else:
    print('ABORT: occurrences inattendues')
