with open('server.mjs', 'r', encoding='utf-8') as f:
    c = f.read()

fixes = 0

# Fix 1: SYSTEM - interdire explicitement "Voici un portrait de"
old1 = '[GENERATE_IMAGE: description detaillee en anglais de l\'image].'
new1 = '[GENERATE_IMAGE: description detaillee en anglais de l\'image]. Ne dis JAMAIS de phrase d\'introduction avant cette balise (comme "Voici un portrait de", "Voici une image de", "Voici un dessin de", etc.). La balise doit etre sur sa propre ligne, sans texte avant.'
if old1 in c:
    c = c.replace(old1, new1, 1)
    fixes += 1
    print('Fix 1 OK: interdiction Voici portrait dans SYSTEM')
else:
    print('ERREUR Fix 1')

# Fix 2: changer le prompt comment dans /api/image
old2 = "content: `Ecris une phrase courte et chaleureuse en francais (une seule phrase) pour presenter une image generee a partir de cette description, puis une question de relance courte pour continuer la conversation. Description: \"${englishPrompt}\". Reponds uniquement avec la phrase et la question, sans guillemets, sans markdown.`"
new2 = "content: `En une seule phrase tres courte en francais, presente cette image sans utiliser les mots 'Voici', 'portrait', 'illustration'. Description: \"${englishPrompt}\". Reponds uniquement avec la phrase, sans guillemets, sans markdown.`"
if old2 in c:
    c = c.replace(old2, new2, 1)
    fixes += 1
    print('Fix 2 OK: prompt comment modifie')
else:
    print('ERREUR Fix 2')

# Fix 3: log dans le catch de /api/image pour diagnostiquer Erreur image
old3 = "} catch(e) { res.status(500).json({ error: e.message }); }\n});\n\napp.post('/api/search'"
new3 = "} catch(e) { console.error('ERREUR /api/image:', e.message); res.status(500).json({ error: e.message }); }\n});\n\napp.post('/api/search'"
if old3 in c:
    c = c.replace(old3, new3, 1)
    fixes += 1
    print('Fix 3 OK: log erreur /api/image')
else:
    print('ERREUR Fix 3')

with open('server.mjs', 'w', encoding='utf-8') as f:
    f.write(c)

print(str(fixes) + '/3 fixes appliques')
