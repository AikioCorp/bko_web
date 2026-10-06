import sys, re

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# E.g.
# <div>
#   <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Icône (Emoji)</label>
#   <input type="text" ... maxLength={2} />
# </div>

pattern = re.compile(r'<div>\s*<label[^>]*>Ic[^<]*ne \(Emoji\)</label>\s*<input[^>]*value=\{editingItem\.icon \|\| ""\}[^>]*/>\s*</div>', re.DOTALL)
content = pattern.sub('', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
