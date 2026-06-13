import re

with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

old = "if(e.name!=='word'&&e.name!=='sentence')return;"
content = c.replace(old, "if(e.name!=='word')return;")  # revert test

# Remove the u.onboundary block entirely and replace with interval-based highlighting
pattern = re.compile(r"u\.onboundary=function\(e\)\{.*?\};", re.DOTALL)
content = pattern.sub("", content)

# Now inject interval-based highlight logic before speechSynthesis.speak(u);
old2 = "btn.textContent='\u23F9\uFE0F';\nspeechSynthesis.speak(u);"
new2 = """btn.textContent='\u23F9\uFE0F';
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
u.onend=function(){clearInterval(hl);btn.textContent='\U0001F50A';bub.innerHTML=bub.dataset.orig;};
u.onerror=function(){clearInterval(hl);btn.textContent='\U0001F50A';bub.innerHTML=bub.dataset.orig;};
speechSynthesis.speak(u);"""

n = content.count(old2)
print('Found old2:', n)
content = content.replace(old2, new2, 1)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
