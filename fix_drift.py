with open('server.mjs', 'r', encoding='utf-8') as f:
    c = f.read()

fixes = 0

# Fix 1: true parasite
old1 = 'pending = imageDone = true;'
new1 = 'imageDone = true;'
if old1 in c:
    c = c.replace(old1, new1, 1)
    fixes += 1
    print('Fix 1 OK: true parasite corrige')
else:
    print('ERREUR Fix 1')

# Fix 2: SYSTEM - supprimer "Avant cette balise, ecris TOUJOURS..."
# et rendre la generation selective
marker_a = 'Avant cette balise, ecris TOUJOURS'
marker_b = 'Ne mentionne JAMAIS le bouton copier'
idx_a = c.find(marker_a)
idx_b = c.find(marker_b)
if idx_a != -1 and idx_b != -1 and idx_a < idx_b:
    old2 = c[idx_a:idx_b]
    new2 = ("N'utilise cette balise [GENERATE_IMAGE] UNIQUEMENT si l'utilisateur "
            "demande explicitement une image ou une illustration. Pour tous les autres "
            "messages (salutations, conseils, histoires, descriptions, etc.), n'utilise "
            "JAMAIS cette balise. Si tu generes une image, presente-la brievement en "
            "une seule phrase sans commencer par 'Voici un portrait de'. ")
    c = c[:idx_a] + new2 + c[idx_b:]
    fixes += 1
    print('Fix 2 OK: SYSTEM selectif, Voici portrait supprime')
else:
    print('ERREUR Fix 2: idx_a=%d idx_b=%d' % (idx_a, idx_b))

with open('server.mjs', 'w', encoding='utf-8') as f:
    f.write(c)

print(str(fixes) + '/2 fixes appliques')
