with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

anchor = "moment+' ?</p></div>';\n"
n = c.count(anchor)
print('found:', n)
content = c.replace(anchor, "moment+' ?</p></div>';addSug();\n", n)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
