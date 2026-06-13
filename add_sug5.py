with open('public/index.html', encoding='utf-8') as f:
    c = f.read()

# Add a call to addSug() on initial load, only if .wl is present (empty conversation)
old = "</script>"
# Replace only the LAST occurrence
idx = c.rfind(old)
insert = "if(document.querySelector('.wl'))addSug();\n"
content = c[:idx] + insert + c[idx:]

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
