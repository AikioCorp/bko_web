import sys, re

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Play to imports
if 'Play,' not in content:
    content = content.replace('Trash2\n} from "lucide-react";', 'Trash2,\n  Play\n} from "lucide-react";')

content = content.replace('<PowerOff className="w-4 h-4 text-[#757575]" />', '<Play className="w-4 h-4 text-[#757575]" />')
content = content.replace('<PowerOff className="w-4 h-4 text-[#757575]" />', '<Play className="w-4 h-4 text-[#757575]" />') # just in case

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
