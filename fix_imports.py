import sys

files = [
    r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\podcasts\import-rss\page.tsx',
    r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\podcasts\new\page.tsx'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('from "navigation"', 'from "next/navigation"')
    content = content.replace('res.error', 'res.message')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done!')
