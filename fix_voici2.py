with open('server.mjs', 'r', encoding='utf-8') as f:
    c = f.read()

# Le Fix 1 precedent a insere des guillemets droits dans une string JS delimitee par "
# On remplace le texte fautif par la version avec guillemets echappes
old1 = ('Ne dis JAMAIS de phrase d\'introduction avant cette balise '
        '(comme "Voici un portrait de", "Voici une image de", "Voici un dessin de", etc.). '
        'La balise doit etre sur sa propre ligne, sans texte avant.')
new1 = ('Ne dis JAMAIS de phrase d\'introduction avant cette balise '
        '(comme \'Voici un portrait de\', \'Voici une image de\', \'Voici un dessin de\', etc.). '
        'La balise doit etre sur sa propre ligne, sans texte avant.')

if old1 in c:
    c = c.replace(old1, new1, 1)
    with open('server.mjs', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: guillemets corriges dans SYSTEM')
else:
    print('ERREUR: chaine non trouvee')
