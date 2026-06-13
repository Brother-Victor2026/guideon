
const PW="guideon2024";
  const userId=localStorage.getItem("gid")||crypto.randomUUID();localStorage.setItem("gid",userId);
let history=[],ve=false,rec=null,il=false;
function cp(){const p=document.getElementById('pi').value;if(p===PW){document.getElementById('lm').classList.remove('show');}else{document.getElementById('pe').style.display='block';}}
function tvv(){ve=!ve;document.getElementById('vt').textContent=ve?'🔊':'🔇';}
function sp(t){if(!ve)return;const u=new SpeechSynthesisUtterance(t);u.lang='fr-FR';u.rate=0.9;speechSynthesis.speak(u);}function speak(btn){
const bub=btn.closest('.mc').querySelector('.bub');
if(speechSynthesis.speaking){
speechSynthesis.cancel();
document.querySelectorAll('.cb').forEach(b=>{if(b.textContent.indexOf('⏹️')>=0)b.textContent='🔊';});
document.querySelectorAll('.tts-w').forEach(s=>s.classList.remove('tts-active'));
return;
}
if(!bub.dataset.orig)bub.dataset.orig=bub.innerHTML;
const text=bub.innerText;
const words=[];const re2=/\S+/g;let mm;
while((mm=re2.exec(text))!==null){words.push({w:mm[0],s:mm.index,e:mm.index+mm[0].length});}
let html='';let last=0;
words.forEach((w,i)=>{html+=text.slice(last,w.s).replace(/\n/g,'<br>');html+='<span class="tts-w" data-i="'+i+'">'+w.w+'</span>';last=w.e;});
html+=text.slice(last).replace(/\n/g,'<br>');
bub.innerHTML=html;
const u=new SpeechSynthesisUtterance(text);
u.lang='fr-FR';u.rate=0.9;

btn.textContent='⏹️';
const wpm=135*u.rate;
const msPerWord=60000/wpm;
let wi=0;
const hl=setInterval(()=>{
if(wi>=words.length){clearInterval(hl);return;}
bub.querySelectorAll('.tts-w').forEach(s=>s.classList.remove('tts-active'));
const sp=bub.querySelector('.tts-w[data-i="'+wi+'"]');
if(sp)sp.classList.add('tts-active');
wi++;
},msPerWord);
u.onend=function(){clearInterval(hl);btn.textContent='🔊';bub.innerHTML=bub.dataset.orig;};
u.onerror=function(){clearInterval(hl);btn.textContent='🔊';bub.innerHTML=bub.dataset.orig;};
speechSynthesis.speak(u);
}
function tm(){if(!('webkitSpeechRecognition'in window||'SpeechRecognition'in window)){alert('Micro non supporte.');return;}if(il){rec.stop();return;}rec=new(window.SpeechRecognition||window.webkitSpeechRecognition)();rec.lang='fr-FR';rec.onstart=()=>{il=true;document.getElementById('mb').classList.add('on');};rec.onresult=(e)=>{document.getElementById('ui').value=e.results[0][0].transcript;};rec.onend=()=>{il=false;document.getElementById('mb').classList.remove('on');};rec.start();}
function up(p){const i=document.getElementById('ui');i.value=p;i.focus();}
function cc(){history=[];document.getElementById('chat').innerHTML='<div class="wl"><div class="big">🧠</div><h2>Nouvelle conversation</h2><p>Que puis-je faire ?</p></div>';addSug();}
function gt(){return new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}
function am(role,content,img=null){const chat=document.getElementById('chat');const wl=chat.querySelector('.wl');if(wl)wl.remove();const d=document.createElement('div');d.className='msg '+(role==='guideon'?'g':'user');const av=role==='guideon'?'🧠':'👤';const ac=role==='guideon'?'g':'u';const t=content.replace(/\n/g,'<br>');const ih=img?'<br><img src="'+img+'" style="max-width:220px;border-radius:12px;margin-top:8px">':'';const ah=role==='guideon'?'<div class="ba"><button class="cb" onclick="navigator.clipboard.writeText(this.closest(\'.mc\').querySelector(\'.bub\').innerText)">Copier</button><button class="cb" onclick="fb(this,1)">👍</button><button class="cb" onclick="fb(this,-1)">👎</button><button class="cb" onclick="speak(this)">🔊</button><button class="cb" onclick="shareMsg(this)">Partager</button></div>':'';d.innerHTML='<div class="av '+ac+'">'+av+'</div><div class="mc"><div class="bub">'+t+ih+'</div>'+ah+'<div class="mt">'+gt()+'</div></div>';if(content===''){const b=d.querySelector('.bub');if(b)b.dataset.fmt='1'}chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d;}
function sty(){const chat=document.getElementById('chat');const d=document.createElement('div');d.className='msg g';d.id='ty';d.innerHTML='<div class="av g">🧠</div><div class="ty"><span></span><span></span><span></span></div>';chat.appendChild(d);chat.scrollTop=chat.scrollHeight;}
function rty(){const t=document.getElementById('ty');if(t)t.remove();}
function useSug(t){const ui=document.getElementById('ui');ui.value=t.replace(/&#39;/g,"'");ui.focus();ui.style.height='auto';ui.style.height=Math.min(ui.scrollHeight,120)+'px';}
function addSug(){const chat=document.getElementById('chat');const d=document.createElement('div');d.className='sug';d.innerHTML='<button onclick="useSug(this.dataset.t)" data-t="Crée une image d&#39;un paysage de montagne au coucher du soleil">🎨 Crée une image d&#39;un paysage de montagne au coucher du soleil</button><button onclick="useSug(this.dataset.t)" data-t="Résume ce texte que je vais te coller">📝 Résume ce texte que je vais te coller</button><button onclick="useSug(this.dataset.t)" data-t="Donne-moi des conseils pour mieux gérer mon temps">🎓 Donne-moi des conseils pour mieux gérer mon temps</button><button onclick="useSug(this.dataset.t)" data-t="Aide-moi à élaborer un plan pour organiser mon projet">💡 Aide-moi à élaborer un plan pour organiser mon projet</button><button onclick="useSug(this.dataset.t)" data-t="Aide-moi à rédiger un email professionnel">✍️ Aide-moi à rédiger un email professionnel</button><button onclick="useSug(this.dataset.t)" data-t="Aide-moi à analyser ces données">📊 Aide-moi à analyser ces données</button><button onclick="useSug(this.dataset.t)" data-t="Propose-moi des idées créatives pour ce week-end">🔮 Propose-moi des idées créatives pour ce week-end</button><button onclick="useSug(this.dataset.t)" data-t="Surprends-moi avec une anecdote intéressante">🎁 Surprends-moi avec une anecdote intéressante</button><button onclick="useSug(this.dataset.t)" data-t="Analyse cette image que je vais t&#39;envoyer">👁️ Analyse cette image que je vais t&#39;envoyer</button>';chat.appendChild(d);}
async function sm(){const i=document.getElementById('ui');const msg=i.value.trim();if(!msg)return;i.value='';i.style.height='auto';am('user',msg);sty();try{if(msg.startsWith('/image ')){const p=msg.substring(7);const r=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p})});const d=await r.json();rty();am('guideon','Voici votre image !',d.url);return;}if(msg.startsWith('!web ')){const q=msg.substring(5);const sr=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q})});const sd=await sr.json();const fm=sd.result?'[Info: '+sd.result+']\n\n'+q:q;const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:fm,history})});const d=await r.json();rty();history.push({role:'user',content:fm});history.push({role:'assistant',content:d.reply});am('guideon',d.reply);sp(d.reply);return;}const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,history})});rty();const reader=r.body.getReader();const dec=new TextDecoder();let buf='';let full='';let el=null;let mc;while(true){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop();for(const line of lines){const t=line.trim();if(!t.startsWith('data: '))continue;const dd=t.slice(6);try{const p=JSON.parse(dd);if(p.error)throw new Error(p.error);if(p.content){full+=p.content;if(!el){el=am('guideon','');mc=el.querySelector('.mc');const bub=el.querySelector('.bub');if(bub)bub.dataset.fmt='1'}mc.textContent=full;el.scrollIntoView()}}catch(e){}}}if(!el){el=am('guideon',full||'(reponse vide)')}else{const bub=el.querySelector('.bub');if(bub)bub.innerHTML=full.replace(/\n/g,'<br>')}alert(el.outerHTML);history.push({role:'user',content:msg});history.push({role:'assistant',content:full});sp(full);}catch(e){rty();am('guideon','Erreur: '+e.message);}}
document.getElementById('ui').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sm();}});
document.getElementById('ui').addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';});
