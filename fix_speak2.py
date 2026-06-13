with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

old = """function speak(btn){
  try{
    const text=btn.closest('.mc').querySelector('.bub').innerText;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='fr-FR';
    speechSynthesis.speak(u);
  }catch(e){}
}"""

n = c.count(old)
content = c.replace(old, "", 1)
print('Found:', n)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done, lines:', content.count(chr(10)))
