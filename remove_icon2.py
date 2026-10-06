import sys, re

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<div>\s*<label[^>]*>Ic[^<]*ne \(emoji\)</label>\s*<input name="icon"[^>]*/>\s*</div>', re.DOTALL)
content = pattern.sub('', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
