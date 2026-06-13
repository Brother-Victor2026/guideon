with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

old = "btn.closest('.bub').querySelector('.mc')"
new = "btn.closest('.mc').querySelector('.bub')"

n = c.count(old)
content = c.replace(old, new, 1)
print('Found:', n)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
