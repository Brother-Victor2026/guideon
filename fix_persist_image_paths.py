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

# --- server.mjs : ajouter token/session_id et sauvegarde en base ---
server_old = "const { prompt } = req.body;"
server_new = "const { prompt, token, session_id } = req.body;"

server_old2 = "    res.json({ url: imgUrl, comment });\n  } catch(e) { res.status(500).json({ error: e.message }); }\n});"
server_new2 = """    if (token && session_id && DB) {
      try {
        const user = checkToken(token);
        if (user) {
          await fetch(`${DB}/conversations`, { method: 'POST', headers: { ...SB, 'Prefer': 'return=minimal' }, body: JSON.stringify([
            { user_id: String(user.id), role: 'user', content: prompt, session_id, image_url: null },
            { user_id: String(user.id), role: 'assistant', content: comment, session_id, image_url: imgUrl }
          ])});
        }
      } catch (e) {}
    }
    res.json({ url: imgUrl, comment });
  } catch(e) { res.status(500).json({ error: e.message }); }
});"""

patch("server.mjs", [
    (server_old, server_new, "destructuration req.body"),
    (server_old2, server_new2, "sauvegarde conversations"),
])

# --- public/index.html : commande /image ---
html_old1 = "const p=msg.substring(7);const r=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p})});const d=await r.json();am('guideon',d.comment||'Voici votre image !',d.url);return;"
html_new1 = "const p=msg.substring(7);const r=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p,token:localStorage.getItem('gtoken'),session_id:curSession})});const d=await r.json();am('guideon',d.comment||'Voici votre image !',d.url);return;"

# --- public/index.html : déclencheur mots-clés ---
html_old2 = "const ir=await _of('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:msg})});"
html_new2 = "const ir=await _of('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:msg,token:localStorage.getItem('gtoken'),session_id:curSession})});"

patch("public/index.html", [
    (html_old1, html_new1, "commande /image"),
    (html_old2, html_new2, "declencheur mots-cles"),
])

print("OK - toutes les modifications appliquees.")
