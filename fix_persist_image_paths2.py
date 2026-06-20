import sys

def patch(path, replacements):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new, label in replacements:
        count = content.count(old)
        if count != 1:
            print(f"ERREUR [{path} / {label}]: occurrence inattendue ({count}), abandon.")
            sys.exit(1)
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# --- public/index.html : commande /image (corrige, avec rty()) ---
html_old1 = "const p=msg.substring(7);const r=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p})});const d=await r.json();rty();am('guideon',d.comment||'Voici votre image !',d.url);return;"
html_new1 = "const p=msg.substring(7);const r=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p,token:localStorage.getItem('gtoken'),session_id:curSession})});const d=await r.json();rty();am('guideon',d.comment||'Voici votre image !',d.url);return;"

# --- public/index.html : déclencheur mots-clés ---
html_old2 = "const ir=await _of('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:msg})});"
html_new2 = "const ir=await _of('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:msg,token:localStorage.getItem('gtoken'),session_id:curSession})});"

patch("public/index.html", [
    (html_old1, html_new1, "commande /image"),
    (html_old2, html_new2, "declencheur mots-cles"),
])

print("OK - public/index.html modifie.")
