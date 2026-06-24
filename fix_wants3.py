with open('server.mjs', 'r', encoding='utf-8') as f:
    lines = f.readlines()

found = False
for i, line in enumerate(lines):
    if 'if (desc) {' in line and 'wantsVisual' not in line:
        lines[i] = line.replace('if (desc) {', 'if (desc && wantsVisual) {', 1)
        found = True
        print('OK ligne', i+1, ': wantsVisual guard ajoute')
        break

if not found:
    print('ERREUR: if (desc) non trouve')
else:
    with open('server.mjs', 'w', encoding='utf-8') as f:
        f.writelines(lines)
