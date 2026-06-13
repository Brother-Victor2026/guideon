with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

old = "if(e.name!=='word')return;"
new = "if(e.name!=='word'&&e.name!=='sentence')return;"

n = c.count(old)
content = c.replace(old, new, 1)
print('Found:', n)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
