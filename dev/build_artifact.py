"""Zloží hru do jedného HTML súboru (CSS a JS vložené) na zverejnenie ako Artifact na claude.ai.

Spustenie:  python dev/build_artifact.py [výstupný_súbor]
Bez parametra zapíše dist/pocitarska-dielna.html.
"""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist" / "pocitarska-dielna.html"

html = (root / "index.html").read_text(encoding="utf-8")
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)

# z hlavičky ponecháme názov, opis rozloženia a písma; manifest a ikony v Artifacte netreba
keep = []
for line in head.splitlines():
    s = line.strip()
    if s.startswith("<title>") or 'claude:viewport-fit-sides' in s or "fonts.g" in s:
        keep.append(s)

css = (root / "style.css").read_text(encoding="utf-8")


def inline_script(m):
    src = (root / m.group(1)).read_text(encoding="utf-8")
    if "</script" in src:
        raise SystemExit(f"{m.group(1)} obsahuje </script, nedá sa vložiť")
    return f"<script>\n{src}\n</script>"


body = re.sub(r'<script src="([^"]+)"></script>', inline_script, body)
page = "\n".join(keep) + f"\n<style>\n{css}\n</style>\n" + body.strip() + "\n"

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page, encoding="utf-8")
print(f"{out} ({len(page.encode('utf-8')) // 1024} kB)")
