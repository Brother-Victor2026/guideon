content = open('public/index.html', encoding='utf-8').read()
marker = "reponse vide"
idx = content.find(marker)
if idx == -1:
    print("ERREUR: marqueur introuvable")
else:
    catch_idx = content.rfind("catch(e){}", 0, idx)
    else_idx = content.find("else{", idx)
    print("idx=", idx, "catch_idx=", catch_idx, "else_idx=", else_idx)
    if catch_idx == -1 or else_idx == -1 or else_idx - catch_idx > 500 or else_idx <= catch_idx:
        print("ERREUR: bornes suspectes, rien fait")
    else:
        old_segment = content[catch_idx:else_idx]
        print("SEGMENT TROUVE:")
        print(repr(old_segment))
        new_segment = old_segment.replace(
            "catch(e){}",
            "catch(e){console.error('SSE err',e,dd);window.__lastErr=(e&&e.message||'')+' | '+dd.slice(0,300)}",
            1
        )
        new_segment = new_segment.replace(
            "full||'(reponse vide)'",
            "full||('(reponse vide) [DEBUG: '+(window.__lastErr||'aucune erreur, el jamais cree')+']')",
            1
        )
        print("NOUVEAU SEGMENT:")
        print(repr(new_segment))
        if old_segment != new_segment:
            new_content = content[:catch_idx] + new_segment + content[else_idx:]
            open('public/index.html', 'w', encoding='utf-8').write(new_content)
            print("Remplacement effectue avec succes")
        else:
            print("ABORT: aucun changement detecte, rien ecrit")
