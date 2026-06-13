import re

with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

speaker = "\U0001F50A"
stop = "\u23F9\uFE0F"

pattern = re.compile(r"function speak\(btn\)\{.*?speechSynthesis\.speak\(u\);\}", re.DOTALL)
m = pattern.search(c)
print('Match found:', bool(m))
if m:
    print('Length:', len(m.group()))

new = """function speak(btn){
const bub=btn.closest('.mc').querySelector('.bub');
if(speechSynthesis.speaking){
speechSynthesis.cancel();
document.querySelectorAll('.cb').forEach(b=>{if(b.textContent.indexOf('""" + stop + """')>=0)b.textContent='""" + speaker + """';});
document.querySelectorAll('.tts-w').forEach(s=>s.classList.remove('tts-active'));
return;
}
if(!bub.dataset.orig)bub.dataset.orig=bub.innerHTML;
const text=bub.innerText;
const words=[];const re2=/\\S+/g;let mm;
while((mm=re2.exec(text))!==null){words.push({w:mm[0],s:mm.index,e:mm.index+mm[0].length});}
let html='';let last=0;
words.forEach((w,i)=>{html+=text.slice(last,w.s).replace(/\\n/g,'<br>');html+='<span class="tts-w" data-i="'+i+'">'+w.w+'</span>';last=w.e;});
html+=text.slice(last).replace(/\\n/g,'<br>');
bub.innerHTML=html;
const u=new SpeechSynthesisUtterance(text);
u.lang='fr-FR';u.rate=0.9;
u.onboundary=function(e){
if(e.name!=='word')return;
const idx=words.findIndex(w=>e.charIndex>=w.s&&e.charIndex<w.e);
bub.querySelectorAll('.tts-w').forEach(s=>s.classList.remove('tts-active'));
if(idx>=0){const sp=bub.querySelector('.tts-w[data-i="'+idx+'"]');if(sp)sp.classList.add('tts-active');}
};
u.onend=function(){btn.textContent='""" + speaker + """';bub.innerHTML=bub.dataset.orig;};
u.onerror=function(){btn.textContent='""" + speaker + """';bub.innerHTML=bub.dataset.orig;};
btn.textContent='""" + stop + """';
speechSynthesis.speak(u);
}"""

if m:
    content = c[:m.start()] + new + c[m.end():]
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced, new lines:', content.count(chr(10)))
