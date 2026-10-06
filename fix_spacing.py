import sys

# Replace AdminShell
file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\components\admin\AdminShell.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('<div className="max-w-6xl mx-auto w-full">', '<div className="w-full">')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Replace StudioShell
file_path2 = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\components\studio\StudioShell.tsx'
with open(file_path2, 'r', encoding='utf-8') as f:
    content2 = f.read()
content2 = content2.replace('<div className="max-w-5xl mx-auto w-full">', '<div className="w-full">')
with open(file_path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print('done')
