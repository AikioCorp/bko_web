import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\components\Header.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '        {/* User Icon Button with Hover Dropdown'
end_marker = '      <AppDownloadModal isOpen={isAppModalOpen}'

start_idx = content.find(start_marker)
end_idx = content.rfind('</div>\n\n      <AppDownloadModal isOpen={isAppModalOpen}')

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + '        <UserDropdown />\n      ' + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Header updated!')
else:
    print('Could not find markers', start_idx, end_idx)
