import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\components\Header.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { UserDropdown }' not in content:
    content = content.replace('import { NotificationBell } from "./NotificationBell";', 'import { NotificationBell } from "./NotificationBell";\nimport { UserDropdown } from "./UserDropdown";')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
