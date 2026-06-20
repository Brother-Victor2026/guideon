h = open('public/index.html', encoding='utf-8').read()

old1 = "if(p.content){\nfull+=p.content;if(!el){el=am('guideon','');mc=el.querySelector('.mc');el.scrollIntoView()}"
new1 = "if(p.content){\nfull+=p.content;if(!el){rty();el=am('guideon','');mc=el.querySelector('.mc');el.scrollIntoView()}"
c1 = h.count(old1)
print('occurrences bloc content:', c1)

old2 = "imgHtml='<br><img src=\"'+p.image+'\" style=\"max-width:220px;border-radius:12px;margin-top:8px;\">';\nif(!el){el=am('guideon','');mc=el.querySelector('.mc');el.scrollIntoView()}"
new2 = "imgHtml='<br><img src=\"'+p.image+'\" style=\"max-width:220px;border-radius:12px;margin-top:8px;\">';\nif(!el){rty();el=am('guideon','');mc=el.querySelector('.mc');el.scrollIntoView()}"
c2 = h.count(old2)
print('occurrences bloc image:', c2)

old3 = "if(!el){el=am('guideon',full||'(reponse vide)');}"
new3 = "if(!el){rty();el=am('guideon',full||'(reponse vide)');}"
c3 = h.count(old3)
print('occurrences fallback reponse vide:', c3)

if c1==1 and c2==1 and c3==1:
    h = h.replace(old1,new1).replace(old2,new2).replace(old3,new3)
    open('public/index.html','w',encoding='utf-8').write(h)
    print('Fix indicateur de frappe applique avec succes')
else:
    print('ABORT: une ou plusieurs occurrences ne correspondent pas exactement')
