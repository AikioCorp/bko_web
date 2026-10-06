import sys, re

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Modal backdrop
modal_pattern = re.compile(r'<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">\s*<div className="bg-\[#171717\]')
modal_repl = r'''<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-[#171717]" onClick={(e) => e.stopPropagation()}'''
content = modal_pattern.sub(modal_repl, content)
# Ensure we preserve the full class of the inner div by doing a safer replace:
content = content.replace('<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setEditingItem(null)}>\n          <div className="bg-[#171717]" onClick={(e) => e.stopPropagation()} border border-[#2A2A2A] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden \nanimate-in fade-in zoom-in-95">', '') # oops rollback mental
pass # Wait, let's just use string replace.
