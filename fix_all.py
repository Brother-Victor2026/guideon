c = open('server.mjs', encoding='utf-8').read()

# Fix 1: remplacer le tableau visualWords
old_vw_start = c.find("const visualWords = [")
old_vw_end = c.find("];", old_vw_start) + 2
old_vw = c[old_vw_start:old_vw_end]
print("visualWords trouve:", old_vw_start != -1)

new_vw = """const visualWords = [
      'genere','genere-moi','\u00e9\u00e9nere','\u00e9\u00e9nere-moi',
      'dessine','dessine-moi',
      'illustre','illustre-moi',
      'montre','montre-moi',
      'affiche','affiche-moi',
      'envoie une image','envoie-moi une image',
      'represente','represente-moi','\u00e9\u00e9presente','\u00e9\u00e9presente-moi',
      'visualise','visualise-moi',
      'peins','d\u00e9peins','cr\u00e9e une image','cr\u00e9e-moi',
      'produis une image','imagine',
      'photo de','image de','portrait de','illustration de',
      'aper\u00e7u de','rendu de',
      '\u00e0 quoi ressemble','\u00e7a ressemble \u00e0 quoi','\u00e0 quoi \u00e7a a l\'air',
      'd\u00e9cris visuellement',
      'repr\u00e9sentation visuelle','rendu visuel','visualisation de'
    ];"""

if old_vw_start != -1:
    c = c[:old_vw_start] + new_vw + c[old_vw_end:]
    print("Fix visualWords OK")
else:
    print("ERREUR: visualWords introuvable")

# Fix 2: "true" dans le texte
old_r = "reply = reply.replace(/\\[GENERATE_IMAGE:\\s*[\\s\\S]+?\\]/g, '').trim();"
new_r = "reply = reply.replace(/\\[GENERATE_IMAGE:\\s*[\\s\\S]+?\\]/g, '').replace(/^\\s*true\\s*$/m, '').trim();"
count_r = c.count(old_r)
print("reply.replace occurrences:", count_r)
if count_r == 1:
    c = c.replace(old_r, new_r)
    print("Fix true OK")
else:
    print("ERREUR: reply.replace introuvable")

open('server.mjs', 'w', encoding='utf-8').write(c)
print("server.mjs ecrit")
