import sys

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('../../store/authStore', '@/store/authStore')
    content = content.replace('../../lib/api', '@/lib/api')
    content = content.replace('../components/', '@/components/')
    content = content.replace('../../components/', '@/components/')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_imports(r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\profile\page.tsx')
fix_imports(r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\studio\profile\page.tsx')
print('Done!')
