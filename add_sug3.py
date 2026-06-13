with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

anchor_cc = "Que puis-je faire ?</p></div>';}\n"
n_cc = c.count(anchor_cc)
print('cc anchor found:', n_cc)
content = c.replace(anchor_cc, "Que puis-je faire ?</p></div>';addSug();}\n", 1)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
