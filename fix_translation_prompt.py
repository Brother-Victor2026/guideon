c = open('server.mjs', encoding='utf-8').read()
old = 'content: `Translate to English, reply with ONLY the English words: "${rawPrompt}"`'
new = 'content: `Rewrite this as a short vivid visual scene description in English for an AI image generator. Do not use words like draw, generate, picture of, image of, illustration of - describe the subject and scene directly. Reply with ONLY the description, no quotes: "${rawPrompt}"`'
count = c.count(old)
print('occurrences:', count)
if count == 1:
    c = c.replace(old, new)
    open('server.mjs', 'w', encoding='utf-8').write(c)
    print('Fix translation prompt OK')
else:
    print('ABORT: occurrences inattendues, recherche par sous-chaine')
    idx = c.find('Translate to English')
    print('idx alternatif=', idx)
    if idx != -1:
        print(repr(c[idx-40:idx+150]))
