with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

old = """function showTyping(){
  const chat=document.getElementById('chat');
  const d=document.createElement('div');"""

new = """function showTyping(){
  const chat=document.getElementById('chat');
  const old=document.getElementById('typing-ind');if(old)old.remove();
  const d=document.createElement('div');"""

n = c.count(old)
content = c.replace(old, new, 1)
print('Found:', n)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
