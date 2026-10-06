import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('Loader2\n} from "lucide-react";', 'Loader2,\n  Power,\n  Trash2\n} from "lucide-react";')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
