with open('server.mjs', 'r', encoding='utf-8') as f:
    c = f.read()

fixes = 0

# Fix 1: SYSTEM encore plus strict sur les images
# Remplacer la partie qui dit "si l'utilisateur demande explicitement"
old1 = ("N'utilise cette balise [GENERATE_IMAGE] UNIQUEMENT si l'utilisateur "
        "demande explicitement une image ou une illustration. Pour tous les autres "
        "messages (salutations, conseils, histoires, descriptions, etc.), n'utilise "
        "JAMAIS cette balise. Si tu generes une image, presente-la brievement en "
        "une seule phrase sans commencer par 'Voici un portrait de'. ")
new1 = ("N'utilise la balise [GENERATE_IMAGE] UNIQUEMENT si le message contient "
        "explicitement les mots: image, photo, illustration, dessin, genere, montre-moi. "
        "Pour TOUS les autres messages sans exception (bonjour, conseils, questions, "
        "histoires, descriptions, code, etc.), n'utilise JAMAIS cette balise. "
        "Ne dis jamais de phrase du type 'Voici un portrait de' ou similaire. ")
if old1 in c:
    c = c.replace(old1, new1, 1)
    fixes += 1
    print('Fix 1 OK: SYSTEM tres strict')
else:
    print('ERREUR Fix 1')

# Fix 2: corriger le bug "pending" apres imageDone = true
# pending doit rester une string, pas un boolean
old2 = '            imageDone = true;\n            pending = pending.slice(fullMatch.index + fullMatch[0].length);'
new2 = '            imageDone = true;\n            pending = (typeof pending === \'string\') ? pending.slice(fullMatch.index + fullMatch[0].length) : \'\';'
if old2 in c:
    c = c.replace(old2, new2, 1)
    fixes += 1
    print('Fix 2 OK: pending string guard')
else:
    print('ERREUR Fix 2')

with open('server.mjs', 'w', encoding='utf-8') as f:
    f.write(c)

print(str(fixes) + '/2 fixes appliques')
