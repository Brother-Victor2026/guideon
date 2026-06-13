with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Retirer les appels showTyping()/hideTyping() dans sm()
content = c.replace("showTyping();const r=await fetch('/api/chat'", "const r=await fetch('/api/chat'")
content = content.replace("hideTyping();rty();", "rty();")

# Retirer les définitions des fonctions
import re
content = re.sub(r"function showTyping\(\)\{[^}]*\}[^}]*\}", "", content)
content = re.sub(r"function hideTyping\(\)\{[^}]*\}", "", content)

print('showTyping refs left:', content.count('showTyping'))
print('hideTyping refs left:', content.count('hideTyping'))

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
