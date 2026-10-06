import sys, re

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Power Icon for Categories
cat_power_pattern = re.compile(r'<Power className="w-4 h-4" />')
content = content.replace(
    '<Power className="w-4 h-4" />',
    '{cat.isActive ? <Power className="w-4 h-4 text-[#B8B8B8]" /> : <PowerOff className="w-4 h-4 text-[#757575]" />}',
    1 # Only replace the first one (category)
)

# 2. Update Power Icon for Languages
content = content.replace(
    '<Power className="w-4 h-4" />',
    '{lang.isActive ? <Power className="w-4 h-4 text-[#B8B8B8]" /> : <PowerOff className="w-4 h-4 text-[#757575]" />}',
    1 # Replace the second one (language)
)

# 3. Update Modal backdrop
old_modal_start = '<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">'
new_modal_start = '<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setEditingItem(null)}>'
content = content.replace(old_modal_start, new_modal_start)

old_modal_inner = '<div className="bg-[#171717] border border-[#2A2A2A] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden \nanimate-in fade-in zoom-in-95">'
new_modal_inner = '<div className="bg-[#171717] border border-[#2A2A2A] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden \nanimate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>'
content = content.replace(old_modal_inner, new_modal_inner)

# In case the newline doesn't match perfectly
content = re.sub(
    r'<div className="bg-\[#171717\] border border-\[#2A2A2A\] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden\s*animate-in fade-in zoom-in-95">',
    r'<div className="bg-[#171717] border border-[#2A2A2A] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
