with open('public/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

found = 0
for i, line in enumerate(lines):
    if "am('guideon','Erreur image.')" in line:
        lines[i] = line.replace(
            "am('guideon','Erreur image.')",
            "am('guideon','Erreur image: '+String(e.message||e))"
        )
        found += 1
        print('OK ligne', i+1)

if found == 0:
    print('ERREUR: chaine non trouvee')
else:
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(str(found) + ' occurrence(s) modifiee(s)')
