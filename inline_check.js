let amode='login',curModel='llama-70b',curSession=null,curTemp=0.7;

function stab(m){amode=m;document.getElementById('an').style.display=m==='reg'?'block':'none';document.getElementById('tl').style.background=m==='login'?'#2d1b69':'transparent';document.getElementById('tr').style.background=m==='reg'?'#2d1b69':'transparent';document.getElementById('ab').textContent=m==='login'?'Se connecter':'Créer mon compte';}
function setModel(m){curModel=m;localStorage.setItem('gmodel',m);}
function setTemp(v){curTemp=parseFloat(v);}
function showImgModal(){document.getElementById('imgmod').style.display='flex';}
function showBar(n){const b=document.getElementById('ubar');b.style.display='flex';document.getElementById('uname').textContent='👤 '+n;document.body.style.paddingTop='50px';}
function openSidebar(){document.getElementById('sidebar').style.display='flex';loadSessions();}
function closeSidebar(){document.getElementById('sidebar').style.display='none';}
function showProfile(){document.getElementById('prof').style.display='flex';const tok=localStorage.getItem('gtoken');fetch('/api/memory/view',{headers:{'Authorization':'Bearer '+tok}}).then(r=>r.json()).then(d=>{if(d&&d.instructions)document.getElementById('inst').value=d.instructions;}).catch(()=>{});}

async function loadSessions(){
  const tok=localStorage.getItem('gtoken');if(!tok)return;
  try{
    const r=await fetch('/api/sessions',{headers:{'Authorization':'Bearer '+tok}});
    const sessions=await r.json();
    const list=document.getElementById('sesslist');list.innerHTML='';
    if(!Array.isArray(sessions))return;
    function relDate(d){if(!d)return'';const dt=new Date(d);const now=new Date();const diffH=(now-dt)/3600000;if(diffH<1)return'À l\'instant';if(diffH<24&&dt.getDate()===now.getDate())return Math.floor(diffH)+'h';const y=new Date(now);y.setDate(y.getDate()-1);if(dt.toDateString()===y.toDateString())return'Hier';const y2=new Date(now);y2.setDate(y2.getDate()-2);if(dt.toDateString()===y2.toDateString())return'Avant-hier';const diffD=Math.floor((now-dt)/86400000);if(diffD<7)return'Il y a '+diffD+' jours';return dt.toLocaleDateString('fr-FR')}
sessions.forEach(s=>{
      const div=document.createElement('div');
      div.style.cssText='padding:8px;border-radius:8px;margin-bottom:4px;background:'+(curSession===s.id?'#2d1b69':'transparent')+';border:1px solid #1f1f3a;';
      const title=(s.title||'Nouvelle conversation').replace(/</g,'&lt;').replace(/'/g,'&#39;');
      div.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:4px;"><span onclick="switchSession('+s.id+')" style="color:#e2e8f0;font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;">'+(s.pinned?'📌':'💬')+' '+title+'</span><div style="display:flex;gap:2px;flex-shrink:0;"><button onclick="pinSession('+s.id+','+!s.pinned+')" style="background:none;border:none;color:'+(s.pinned?'#fbbf24':'#6b7280')+';cursor:pointer;font-size:12px;padding:0 2px;">📌</button><button onclick="renameSession('+s.id+',\''+title+'\')" style="background:none;border:none;color:#a78bfa;cursor:pointer;font-size:12px;padding:0 2px;">✏️</button><button onclick="exportSess('+s.id+')" style="background:none;border:none;color:#60a5fa;cursor:pointer;font-size:12px;padding:0 2px;">⬇️</button><button onclick="shareSess('+s.id+')" style="background:none;border:none;color:#34d399;cursor:pointer;font-size:12px;padding:0 2px;">🔗</button><button onclick="deleteSession('+s.id+')" style="background:none;border:none;color:#f87171;cursor:pointer;font-size:12px;padding:0 2px;">🗑</button></div></div><div style="font-size:10px;color:#6b7280;margin-top:2px;padding-left:4px;">'+relDate(s.created_at)+'</div>';
      list.appendChild(div);
    });
  }catch(e){}
}

async function searchHist(q){
  const res=document.getElementById('srchres');
  if(!q){res.style.display='none';return;}
  const tok=localStorage.getItem('gtoken');
  try{
    const r=await fetch('/api/search/history?q='+encodeURIComponent(q),{headers:{'Authorization':'Bearer '+tok}});
    const data=await r.json();
    res.style.display='block';res.innerHTML='<p style="color:#6b7280;font-size:11px;margin-bottom:4px;">Résultats:</p>';
    if(!Array.isArray(data)||!data.length){res.innerHTML+='<p style="color:#9ca3af;font-size:11px;">Aucun résultat</p>';return;}
    data.forEach(m=>{
      const d=document.createElement('div');
      d.style.cssText='padding:5px;background:#1a1a2e;border-radius:5px;margin-bottom:3px;cursor:pointer;';
      const preview=m.content.length>60?m.content.substring(0,60)+'...':m.content;
      d.innerHTML='<p style="color:#e2e8f0;font-size:11px;">'+(m.role==='user'?'👤':'🧠')+' '+preview.replace(/</g,'&lt;')+'</p>';
      if(m.session_id)d.onclick=()=>switchSession(m.session_id);
      res.appendChild(d);
    });
  }catch(e){}
}

async function newSession(){
  const tok=localStorage.getItem('gtoken');
  if(!tok){document.getElementById('am').style.display='flex';return;}
  try{
    const r=await fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tok,title:'Nouvelle conversation'})});
    const s=await r.json();
    if(!s||!s.id)return;
    curSession=s.id;localStorage.setItem('gsession',s.id);
    try{history=[];}catch(e){}
    closeSidebar();
    const hr=new Date().getHours();
    const moment=hr<12?'matin':hr<18?'après-midi':'soir';
    const salut=hr<12?'Bonjour':hr<18?'Bon après-midi':'Bonsoir';
    const name=localStorage.getItem('gname')||'';
    const chat=document.getElementById('chat');
    if(chat)chat.innerHTML='<div class="wl"><div class="big">🧠</div><h2>'+salut+(name?' '+name:'')+'</h2><p>Comment puis-je vous aider ce '+moment+' ?</p></div>';addSug();
  }catch(e){}
}

async function switchSession(id){
  curSession=id;localStorage.setItem('gsession',id);
  const chat=document.getElementById('chat');
  if(chat)chat.innerHTML='';
  try{history=[];}catch(e){}
  closeSidebar();
  const tok=localStorage.getItem('gtoken');
  try{
    const r=await fetch('/api/history/'+id,{headers:{'Authorization':'Bearer '+tok}});
    const data=await r.json();
    if(Array.isArray(data)&&data.length>0)data.forEach(m=>am(m.role==='assistant'?'guideon':m.role,m.content,m.image_url));
    else{
      const hr=new Date().getHours();
      const moment=hr<12?'matin':hr<18?'après-midi':'soir';
      const salut=hr<12?'Bonjour':hr<18?'Bon après-midi':'Bonsoir';
      const name=localStorage.getItem('gname')||'';
      if(chat)chat.innerHTML='<div class="wl"><div class="big">🧠</div><h2>'+salut+(name?' '+name:'')+'</h2><p>Comment puis-je vous aider ce '+moment+' ?</p></div>';addSug();
    }
  }catch(e){}
}

async function pinSession(id,pinned){
  const tok=localStorage.getItem('gtoken');
  await fetch('/api/sessions/'+id+'/pin',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tok,pinned})});
  loadSessions();
}

async function renameSession(id,title){
  const newTitle=prompt('Nouveau titre:',title);if(!newTitle||newTitle===title)return;
  const tok=localStorage.getItem('gtoken');
  await fetch('/api/sessions/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tok,title:newTitle})});
  loadSessions();
}

async function exportSess(id){
  const tok=localStorage.getItem('gtoken');
  try{
    const r=await fetch('/api/export/'+id,{headers:{'Authorization':'Bearer '+tok}});
    const blob=await r.blob();const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='conversation-'+id+'.txt';a.click();
  }catch(e){alert('Erreur export');}
}

function shareSess(id){
  document.getElementById('sharelink').textContent=window.location.origin+'/api/share/'+id;
  document.getElementById('sharemod').style.display='flex';
}

function copyShare(){
  const link=document.getElementById('sharelink').textContent;
  navigator.clipboard.writeText(link).then(()=>alert('✅ Lien copié!')).catch(()=>{const ta=document.createElement('textarea');ta.value=link;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);alert('✅ Copié!');});
}

async function deleteSession(id){
  if(!confirm('Supprimer cette conversation ?'))return;
  const tok=localStorage.getItem('gtoken');
  await fetch('/api/sessions/'+id,{method:'DELETE',headers:{'Authorization':'Bearer '+tok}});
  if(curSession===id){curSession=null;localStorage.removeItem('gsession');const chat=document.getElementById('chat');if(chat)chat.innerHTML='';try{history=[];}catch(e){}}
  loadSessions();
}

async function doAuth(){
  const e=document.getElementById('ae').value.trim(),p=document.getElementById('ap').value,n=document.getElementById('an').value.trim(),er=document.getElementById('ae2');
  if(!e||!p){er.textContent='Remplis tous les champs';er.style.display='block';return;}
  er.style.display='none';const btn=document.getElementById('ab');btn.textContent='⏳';btn.disabled=true;
  try{
    const r=await fetch('/api/'+(amode==='login'?'login':'register'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e,password:p,name:n})});
    const d=await r.json();
    if(d.error){er.textContent=d.error;er.style.display='block';btn.textContent=amode==='login'?'Se connecter':'Créer mon compte';btn.disabled=false;return;}
    localStorage.setItem('gtoken',d.token);localStorage.setItem('gname',d.name||e.split('@')[0]);
    document.getElementById('am').style.display='none';
    const lm=document.getElementById('lm');if(lm)lm.classList.remove('show');
    showBar(localStorage.getItem('gname'));
    const saved=localStorage.getItem('gsession');
    if(saved){curSession=parseInt(saved);await switchSession(curSession);}else await newSession();
  }catch(err){er.textContent='Erreur de connexion';er.style.display='block';btn.textContent='Se connecter';btn.disabled=false;}
}

function logout(){if(!confirm('Se déconnecter ?'))return;localStorage.removeItem('gtoken');localStorage.removeItem('gname');localStorage.removeItem('gsession');location.reload();}

async function saveProfile(){
  const n=document.getElementById('pn').value.trim(),p=document.getElementById('pp').value,inst=document.getElementById('inst').value;
  const tok=localStorage.getItem('gtoken');
  try{
    if(n||p){const r=await fetch('/api/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tok,name:n,password:p})});const d=await r.json();if(d.success&&n){localStorage.setItem('gname',n);document.getElementById('uname').textContent='👤 '+n;}}
    await fetch('/api/instructions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tok,instructions:inst})});
    alert('✅ Profil mis à jour!');document.getElementById('prof').style.display='none';
  }catch(e){alert('Erreur sauvegarde');}
}

async function viewMemory(){
  const tok=localStorage.getItem('gtoken');
  try{
    const r=await fetch('/api/memory/view',{headers:{'Authorization':'Bearer '+tok}});
    const d=await r.json();const mv=document.getElementById('memview');mv.style.display='block';
    mv.innerHTML='<b style="color:#a78bfa;">🧠 Ta mémoire:</b><br>👤 '+( d.name||'?')+'<br>📧 '+(d.email||'?')+'<br>📝 '+(d.instructions||'Aucune instruction')+'<br>📅 '+(d.created_at?new Date(d.created_at).toLocaleDateString('fr-FR'):'?');
  }catch(e){}
}

async function clearMem(){
  if(!confirm('Effacer toute ta mémoire ?'))return;
  await fetch('/api/memory',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:localStorage.getItem('gtoken')})});
  alert('✅ Mémoire effacée!');location.reload();
}

async function delAccount(){
  if(!confirm('Supprimer définitivement ton compte ?'))return;
  await fetch('/api/account',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:localStorage.getItem('gtoken')})});
  localStorage.clear();location.reload();
}

async function analyzeImg(){
  const url=document.getElementById('imgurl').value.trim(),q=document.getElementById('imgq').value.trim();
  if(!url){alert('Entre une URL');return;}
  document.getElementById('imgmod').style.display='none';
  am('user','🖼️ '+(q||'Analyse cette image'));sty();
  try{
    const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageUrl:url,question:q||'Décris cette image en détail.'})});
    const d=await r.json();rty();am('guideon',d.reply||'Impossible d\'analyser.');
    if(typeof ve!=='undefined'&&ve&&typeof sp==='function')sp(d.reply||'');
  }catch(e){rty();am('guideon','Erreur analyse.');}
  document.getElementById('imgurl').value='';document.getElementById('imgq').value='';
}

async function regenLast(msg){
  const tok=localStorage.getItem('gtoken');
  try{
    await fetch('/api/regenerate',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tok,session_id:curSession})});
    const msgs=document.querySelectorAll('#chat .msg');
    if(msgs.length>=2){msgs[msgs.length-1].remove();msgs[msgs.length-2].remove();}
    else if(msgs.length===1)msgs[0].remove();
    document.getElementById('ui').value=msg;sm();
  }catch(e){}
}

const tok=localStorage.getItem('gtoken');
const savedModel=localStorage.getItem('gmodel');
const savedTemp=localStorage.getItem('gtemp');
if(savedModel){curModel=savedModel;document.getElementById('msel').value=savedModel;}
if(savedTemp){curTemp=parseFloat(savedTemp);document.getElementById('temp').value=savedTemp;}

if(!tok){
  document.getElementById('am').style.display='flex';
}else{
  showBar(localStorage.getItem('gname'));
  const lm=document.getElementById('lm');if(lm)lm.classList.remove('show');
  const saved=localStorage.getItem('gsession');
  if(saved){curSession=parseInt(saved);switchSession(curSession);}
  else newSession();
}

// MutationObservers
const chatObs=new MutationObserver(mutations=>{
  mutations.forEach(m=>m.addedNodes.forEach(node=>{
    if(node.nodeType===1){
      (node.querySelectorAll?node.querySelectorAll('img'):[]).forEach(img=>{
        if(!img.dataset.dl){
          img.dataset.dl='1';
          const a=document.createElement('a');
          a.href=img.src;a.target='_blank';a.download='guideon-image.jpg';
          a.textContent='⬇️ Enregistrer';
          a.style.cssText='display:block;margin-top:6px;padding:5px 12px;background:#2d1b69;color:#fff;border-radius:8px;font-size:12px;text-decoration:none;text-align:center;';
          img.parentNode.insertBefore(a,img.nextSibling);
        }
      });
    }
  }));
});

const codeObs=new MutationObserver(mutations=>{
  mutations.forEach(m=>m.addedNodes.forEach(node=>{
    if(node.nodeType===1){
      const bubs=node.querySelectorAll?node.querySelectorAll('.bub'):[];
      bubs.forEach(bub=>{
        if(bub.dataset.fmt)return;bub.dataset.fmt='1';
        let html=bub.innerHTML;
        html=html.replace(/`{3}(\w*)<br>([\s\S]*?)`{3}/g,(match,lang,code)=>{
          const clean=code.replace(/<br>/g,'\n').replace(/<[^>]*>/g,'').trim();
          const esc=clean.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          const id='c'+Math.random().toString(36).slice(2);
          return '<div style="background:#0f0f1a;border:1px solid #2d1b69;border-radius:8px;margin:8px 0;overflow:hidden;"><div style="display:flex;justify-content:space-between;align-items:center;padding:4px 10px;background:#1a1a2e;border-bottom:1px solid #2d1b69;"><span style="color:#6b7280;font-size:11px;">'+(lang||'code')+'</span><button onclick="navigator.clipboard.writeText(document.getElementById(\''+id+'\').innerText).then(()=>{this.textContent=\'✅\';setTimeout(()=>this.textContent=\'📋 Copier\',2000)})" style="background:none;border:none;color:#a78bfa;cursor:pointer;font-size:11px;padding:2px 6px;">📋 Copier</button></div><pre id="'+id+'" style="margin:0;padding:10px;color:#e2e8f0;font-family:monospace;font-size:12px;overflow-x:auto;white-space:pre-wrap;">'+esc+'</pre></div>';
        });
        bub.innerHTML=html;
      });
    }
  }));
});

const editObs=new MutationObserver(mutations=>{
  mutations.forEach(m=>m.addedNodes.forEach(node=>{
    if(node.nodeType===1&&node.classList&&node.classList.contains('msg')&&node.classList.contains('user')){
      const bub=node.querySelector('.bub');const mc=node.querySelector('.mc');
      if(bub&&mc&&!mc.querySelector('.edit-btn')){
        const editBtn=document.createElement('button');
        editBtn.className='edit-btn cb';editBtn.textContent='✏️ Modifier';
        editBtn.style.cssText='margin-top:4px;font-size:11px;';
        editBtn.onclick=async()=>{
          const txt=bub.innerText;document.getElementById('ui').value=txt;document.getElementById('ui').focus();
          const tok=localStorage.getItem('gtoken');
          await fetch('/api/regenerate',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tok,session_id:curSession})});
          const msgs=document.querySelectorAll('#chat .msg');
          if(msgs.length>=2){msgs[msgs.length-1].remove();msgs[msgs.length-2].remove();}
          else if(msgs.length===1)msgs[0].remove();
        };
        mc.appendChild(editBtn);
      }
    }
  }));
});

setTimeout(()=>{
  const c=document.getElementById('chat');
  if(c){
    chatObs.observe(c,{childList:true,subtree:true});
    codeObs.observe(c,{childList:true,subtree:true});
    editObs.observe(c,{childList:true,subtree:false});
  }
},1000);

function addUploadBtn(){
  const mb=document.getElementById('mb');
  if(!mb||document.getElementById('uploadBtn'))return;
  const inp=document.createElement('input');
  inp.type='file';inp.id='fileInp';inp.accept='image/*';inp.style.display='none';
  inp.onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      const b64=ev.target.result;
      const q=prompt('Question sur cette image ? (optionnel)','');
      am('user','📸 '+(q||'Analyse cette image'));sty();
      try{
        const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageUrl:b64,question:q||'Décris cette image en détail.'})});
        const d=await r.json();rty();am('guideon',d.reply||'Impossible d\'analyser.');
      }catch(err){rty();am('guideon','Erreur analyse.');}
    };
    reader.readAsDataURL(file);e.target.value='';
  };
  document.body.appendChild(inp);
  const btn=document.createElement('button');btn.id='uploadBtn';btn.textContent='📎';
  btn.style.cssText='background:#1a1a2e;border:1px solid #2a2a4a;color:#a78bfa;width:44px;height:44px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
  btn.onclick=()=>document.getElementById('fileInp').click();
  mb.parentNode.insertBefore(btn,mb);
}
setTimeout(addUploadBtn,1000);

const _of=window.fetch;
window.fetch=async function(u,o={}){
  if(u==='/api/chat'&&o.body){
    try{
      const b=JSON.parse(o.body);
      b.token=localStorage.getItem('gtoken');
      b.model=curModel;
      b.temperature=curTemp;
      b.userTime=new Date().toLocaleString('fr-FR');
      const msg=b.message;
      if(!curSession){
        const tok2=localStorage.getItem('gtoken');
        const sr=await _of('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tok2,title:'Nouvelle conversation'})});
        const ss=await sr.json();
        if(ss&&ss.id){curSession=ss.id;localStorage.setItem('gsession',ss.id);}
      }
      b.session_id=curSession;
      const imgWords=['génère une image','crée une image','génère moi','dessine','montre une image','donne moi une image','fais moi une image','je veux une image','montre moi une image','affiche une image','generate an image','create an image','draw me'];
      if(imgWords.some(w=>msg.toLowerCase().includes(w))){
        try{
          const ir=await _of('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:msg})});
          const imgData=await ir.json();
          const ty2=document.getElementById('ty');if(ty2)ty2.remove();
          if(imgData.url){
            const chat=document.getElementById('chat');
            const msgDiv=document.createElement('div');msgDiv.className='msg g';
            msgDiv.innerHTML='<div class="av g">🧠</div><div class="mc"><div class="bub">🎨 Voici votre image !<br><img src="'+imgData.url+'" style="max-width:220px;border-radius:12px;margin-top:8px;"></div><div class="mt">'+gt()+'</div></div>';
            chat.appendChild(msgDiv);chat.scrollTop=chat.scrollHeight;
          }else{am('guideon','Erreur: '+(imgData.error||'image non générée'));}
        }catch(e){const ty2=document.getElementById('ty');if(ty2)ty2.remove();am('guideon','Erreur image.');}
        return new Response(JSON.stringify({reply:''}),{status:200,headers:{'Content-Type':'application/json'}});
      }
      if(document.getElementById('tmpChat')&&document.getElementById('tmpChat').checked){
        o.body=JSON.stringify(b);return _of('/api/chat/temp',o);
      }
      o.body=JSON.stringify(b);
    }catch(e){}
  }
  return _of(u,o);
};


function fb(btn,val){
  const card=btn.closest('.ba');
  card.querySelectorAll('.cb').forEach(b=>{if(b.textContent==='👍'||b.textContent==='👎')b.style.opacity='0.4';});
  btn.style.opacity='1';
  try{
    const tok=localStorage.getItem('gtoken');
    const text=btn.closest('.mc').querySelector('.bub').innerText;
    fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},body:JSON.stringify({message:text,rating:val})});
  }catch(e){}
}

function shareMsg(btn){
  try{
    const text=btn.closest('.mc').querySelector('.bub').innerText;
    if(navigator.share){navigator.share({text:text});}
    else{navigator.clipboard.writeText(text);alert('Copié (partage non supporté)');}
  }catch(e){}
}


if(document.querySelector('.wl'))addSug();
