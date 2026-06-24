with open('server.mjs', 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed = 0
for i, line in enumerate(lines):
    if 'order=created_at.asc' in line and 'session_id' in line:
        lines[i] = line.replace('order=created_at.asc', 'order=id.asc', 1)
        fixed += 1
        print('OK ligne', i+1)

if fixed == 0:
    print('ERREUR: chaine non trouvee')
else:
    with open('server.mjs', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(str(fixed) + ' occurrence(s) modifiee(s)')
