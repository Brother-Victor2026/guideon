content = open('server.mjs', encoding='utf-8').read()

start_route = content.find("app.post('/api/image'")
end_route = content.find("app.post('/api/search'")
print('start_route=', start_route, 'end_route=', end_route)

if start_route == -1 or end_route == -1 or end_route <= start_route:
    print('ERREUR: route /api/image introuvable')
else:
    segment = content[start_route:end_route]

    idx_stability = segment.find('api.stability.ai')
    if idx_stability == -1:
        print('ERREUR: appel stability.ai introuvable dans la route')
    else:
        line_start = segment.rfind('\n', 0, idx_stability) + 1

        idx_catch = segment.find('} catch(e)', line_start)
        if idx_catch == -1:
            print('ERREUR: bloc catch introuvable')
        else:
            before = segment[:line_start]
            after = segment[idx_catch:]
            replacement = (
                "    const imgUrl = await callStabilityAI(englishPrompt);\n"
                "    if (!imgUrl) return res.status(500).json({ error: 'Image non generee' });\n"
                "    res.json({ url: imgUrl });\n  "
            )
            new_segment = before + replacement + after
            new_content = content[:start_route] + new_segment + content[end_route:]
            print('--- ANCIEN SEGMENT REMPLACE ---')
            print(repr(segment[line_start:idx_catch]))
            print('--- NOUVEAU SEGMENT ---')
            print(repr(replacement))
            open('server.mjs', 'w', encoding='utf-8').write(new_content)
            print('Remplacement effectue avec succes')
