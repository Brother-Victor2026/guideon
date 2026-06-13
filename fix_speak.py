with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

old = "function sp(t){if(!ve)return;const u=new SpeechSynthesisUtterance(t);u.lang='fr-FR';u.rate=0.9;speechSynthesis.speak(u);}"

speaker = chr(0x1F50A)
stop = chr(0x23F9) + chr(0xFE0F)

new = old + "function speak(btn){if(speechSynthesis.speaking){speechSynthesis.cancel();document.querySelectorAll('.cb').forEach(b=>{if(b.textContent.indexOf('" + stop + "')>=0)b.textContent='" + speaker + "';});return;}const t=btn.closest('.bub').querySelector('.mc').innerText;const u=new SpeechSynthesisUtterance(t);u.lang='fr-FR';u.rate=0.9;u.onend=function(){btn.textContent='" + speaker + "';};u.onerror=function(){btn.textContent='" + speaker + "';};btn.textContent='" + stop + "';speechSynthesis.speak(u);}"

n = c.count(old)
content = c.replace(old, new, 1)
print('Found:', n)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done, lines:', content.count(chr(10)))
