h = open('public/index.html', encoding='utf-8').read()
start_idx = h.find("data.forEach(m=>am(m.role")
print('start_idx=', start_idx)
if start_idx != -1:
    end_idx = h.find(");", start_idx) + 2
    segment = h[start_idx:end_idx]
    print('SEGMENT EXACT:')
    print(repr(segment))
else:
    print('introuvable meme avec marqueur court')
