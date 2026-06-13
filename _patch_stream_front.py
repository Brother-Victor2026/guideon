with open('public/index.html', 'r') as f:
    content = f.read()

# Patch 1: am() doit retourner l'élément créé
old_am = "chat.appendChild(d);chat.scrollTop=chat.scrollHeight;}"
new_am = "chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d;}"

if old_am not in content:
    print("ERREUR: bloc am() non trouve.")
    exit(1)
content = content.replace(old_am, new_am, 1)

# Patch 2: sm() - remplacer le bloc final /api/chat par version streaming
old_sm = "const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,history})});const d=await r.json();rty();if(d.reply){history.push({role:'user',content:msg});history.push({role:'assistant',content:d.reply});am('guideon',d.reply);sp(d.reply)}}catch(e){rty();am('guideon','Erreur: '+e.message);}}"

new_sm = """const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,history})});
rty();
const reader=r.body.getReader();const dec=new TextDecoder();let buf='';let full='';let el=null;
while(true){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\\n');buf=lines.pop();for(const line of lines){const t=line.trim();if(!t.startsWith('data: '))continue;const dd=t.slice(6);try{const p=JSON.parse(dd);if(p.error)throw new Error(p.error);if(p.content){full+=p.content;if(!el){el=am('guideon','')}el.textContent=full;chat.scrollTop=chat.scrollHeight}}catch(e){}}}
if(!el){el=am('guideon',full||'(reponse vide)')}
history.push({role:'user',content:msg});history.push({role:'assistant',content:full});
sp(full);
}catch(e){rty();am('guideon','Erreur: '+e.message);}}"""

if old_sm not in content:
    print("ERREUR: bloc sm() final non trouve.")
    exit(1)
content = content.replace(old_sm, new_sm, 1)

with open('public/index.html', 'w') as f:
    f.write(content)

print("OK: index.html patche avec succes.")
