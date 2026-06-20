h = open('public/index.html', encoding='utf-8').read()

start_marker = "async function sm(){"
end_marker = "document.getElementById('ui').addEventListener('keydown'"

start_idx = h.find(start_marker)
end_idx = h.find(end_marker)
print('start_idx=', start_idx, 'end_idx=', end_idx)

if start_idx == -1 or end_idx == -1 or end_idx <= start_idx:
    print('ERREUR: bornes introuvables')
else:
    new_sm = """async function sm(){
const i=document.getElementById('ui');const msg=i.value.trim();if(!msg)return;i.value='';i.style.height='auto';am('user',msg);sty();
try{
if(msg.startsWith('/image ')){
const p=msg.substring(7);const r=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p})});const d=await r.json();rty();am('guideon','Voici votre image !',d.url);return;
}
if(msg.startsWith('!web ')){
const q=msg.substring(5);const sr=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q})});const sd=await sr.json();const fm=sd.result?'[Info: '+sd.result+']\\n\\n'+q:q;const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:fm,history:chatHistory})});const d=await r.json();rty();am('guideon',d.reply);sp(d.reply);return;
}
const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,history:chatHistory})});
const reader=r.body.getReader();const dec=new TextDecoder();let buf='';let full='';let el=null;let mc;let imgHtml='';
while(true){
const {done,value}=await reader.read();if(done)break;
buf+=dec.decode(value,{stream:true});const lines=buf.split('\\n');buf=lines.pop();
for(const line of lines){
const t=line.trim();if(!t.startsWith('data: '))continue;const dd=t.slice(6);
try{
const p=JSON.parse(dd);if(p.error)throw new Error(p.error);
if(p.content){
full+=p.content;if(!el){el=am('guideon','');mc=el.querySelector('.mc');el.scrollIntoView()}
const bub=el.querySelector('.bub');if(bub)bub.innerHTML=marked.parse(full)+imgHtml;
document.getElementById('chat').scrollTop=document.getElementById('chat').scrollHeight;
}else if(p.image){
imgHtml='<br><img src="'+p.image+'" style="max-width:220px;border-radius:12px;margin-top:8px;">';
if(!el){el=am('guideon','');mc=el.querySelector('.mc');el.scrollIntoView()}
const bub=el.querySelector('.bub');if(bub)bub.innerHTML=marked.parse(full)+imgHtml;
document.getElementById('chat').scrollTop=document.getElementById('chat').scrollHeight;
}
}catch(e){console.error('SSE err',e,dd);}
}
}
if(!el){el=am('guideon',full||'(reponse vide)');}else{const bub=el.querySelector('.bub');if(bub)bub.innerHTML=marked.parse(full)+imgHtml;}
chatHistory.push({role:'user',content:msg});chatHistory.push({role:'assistant',content:full});sp(full);
}catch(e){rty();am('guideon','Erreur: '+e.message);}
}
"""
    h = h[:start_idx] + new_sm + h[end_idx:]
    open('public/index.html', 'w', encoding='utf-8').write(h)
    print('sm() reecrite avec succes')
