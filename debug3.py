with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

old = "function showTyping(){console.log('showTyping call, existing typing-ind count before:', document.querySelectorAll('#typing-ind').length);"

new = "function showTyping(){window._stCount=(window._stCount||0)+1;document.title='ST:'+window._stCount+' ind:'+document.querySelectorAll('#typing-ind').length;"

n = c.count(old)
content = c.replace(old, new, 1)
print('Found:', n)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
