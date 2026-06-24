with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Apres la fin du stream, nettoyer "Voici un portrait de..." dans la bulle
old = "if(!el){rty();if(full)el=am('guideon',full);}else{const bub=el.querySelector('.bub');if(bub)bub.innerHTML=marked.parse(full)+imgHtml;}"
new = ("if(!el){rty();if(full)el=am('guideon',full);}else{const bub=el.querySelector('.bub');"
       "if(bub)bub.innerHTML=marked.parse(full)+imgHtml;}"
       "const _bub=el&&el.querySelector('.bub');"
       "if(_bub)_bub.innerHTML=_bub.innerHTML.replace(/Voici (un|une) (portrait|image|dessin|tableau|illustration|aperçu) de[^.!?\\n]*[.!?]?\\s*/gi,'');")

if old in c:
    c = c.replace(old, new, 1)
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: filtre Voici portrait apres stream')
else:
    print('ERREUR: chaine non trouvee')
