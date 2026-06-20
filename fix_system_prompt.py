c = open('server.mjs', encoding='utf-8').read()
marker = "description detaillee en anglais de l'image]."
idx = c.find(marker)
print('idx=', idx)
if idx != -1:
    insert_at = idx + len(marker)
    insertion = " Avant cette balise, ecris TOUJOURS une phrase courte et chaleureuse pour presenter l'image que tu vas generer, suivie d'une question de relance pour continuer la conversation."
    c = c[:insert_at] + insertion + c[insert_at:]
    open('server.mjs', 'w', encoding='utf-8').write(c)
    print('Instruction ajoutee avec succes')
else:
    print('ERREUR: marqueur introuvable')
