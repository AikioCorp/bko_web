import os
import re

directory = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app'

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            content = re.sub(r'\bmax-w-7xl\s+mx-auto\b', 'w-full', content)
            content = re.sub(r'\bmax-w-6xl\s+mx-auto\b', 'w-full', content)
            content = re.sub(r'\bmax-w-5xl\s+mx-auto\b', 'w-full', content)
            
            # For cases where mx-auto is not immediately following
            content = re.sub(r'\bmax-w-7xl\b', 'w-full', content)
            content = re.sub(r'\bmax-w-6xl\b', 'w-full', content)
            content = re.sub(r'\bmax-w-5xl\b', 'w-full', content)
            
            # also remove mx-auto if it's left floating unnecessarily, but it's fine
            content = content.replace('w-full mx-auto', 'w-full')
            
            if original != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")
print('Done!')
