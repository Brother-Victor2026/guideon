with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Compter les occurrences de gt(ts)
count = c.count("'+gt(ts)+'")
print('occurrences gt(ts):', count)

# On garde gt(ts) seulement dans am() - les autres doivent redevenir gt()
# Strategie: remplacer TOUTES les occurrences, puis remettre gt(ts) uniquement dans am()
# Plus simple: trouver les occurrences hors am() et les remettre a gt()

lines = c.split('\n')
in_am = False
fixed = 0
for i, line in enumerate(lines):
    if 'function am(' in line:
        in_am = True
    if in_am and "'+gt(ts)+'" in line:
        in_am = False  # on a passe le gt(ts) de am(), on sort
        continue
    if "'+gt(ts)+'" in line and not in_am:
        lines[i] = line.replace("'+gt(ts)+'", "'+gt()+'", 1)
        fixed += 1
        print('Fix ligne', i+1)

c = '\n'.join(lines)
with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print(str(fixed) + ' occurrence(s) corrigee(s) hors am()')
