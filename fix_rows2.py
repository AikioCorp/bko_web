import sys, re

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we have the imports
if 'Power' not in content:
    content = content.replace('import { Search, Plus, CheckCircle, XCircle, Loader2 } from "lucide-react";', 'import { Search, Plus, CheckCircle, XCircle, Loader2, Power, Trash2 } from "lucide-react";')

# Transform category row
cat_row_pattern = re.compile(r'<tr key=\{cat\.id\} className="hover:bg-\[#1C1C1C\] transition-colors group">')
cat_row_repl = r'<tr key={cat.id} className="hover:bg-[#1C1C1C] transition-colors group cursor-pointer" onClick={() => setEditingItem({ ...cat, isCategory: true })}>'
content = cat_row_pattern.sub(cat_row_repl, content)

# Transform language row
lang_row_pattern = re.compile(r'<tr key=\{lang\.code\} className="hover:bg-\[#1C1C1C\] transition-colors group">')
lang_row_repl = r'<tr key={lang.code} className="hover:bg-[#1C1C1C] transition-colors group cursor-pointer" onClick={() => setEditingItem({ ...lang, isLanguage: true, isEdit: true })}>'
content = lang_row_pattern.sub(lang_row_repl, content)

# Transform category buttons
cat_btn_pattern = re.compile(r'<Button size="sm" variant="ghost" className="h-8 px-2 text-\[#B8B8B8\] hover:text-white"\s*onClick=\{\(\) => setEditingItem\(\{ \.\.\.cat, isCategory: true \}\)\}>\s*Modifier\s*</Button>', re.DOTALL)
content = cat_btn_pattern.sub('', content)

cat_toggle_pattern = re.compile(r'onClick=\{\(\) => handleToggleCategory\(cat\)\}>\s*\{cat\.isActive \? "D[^"]*sactiver" : "Activer"\}\s*</Button>', re.DOTALL)
cat_toggle_repl = r'''onClick={(e) => { e.stopPropagation(); handleToggleCategory(cat); }}>
                              <Power className="w-4 h-4" />
                            </Button>'''
content = cat_toggle_pattern.sub(cat_toggle_repl, content)

cat_del_pattern = re.compile(r'onClick=\{\(\) => handleDeleteCategory\(cat\.id\)\}>\s*Supprimer\s*</Button>', re.DOTALL)
cat_del_repl = r'''onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>'''
content = cat_del_pattern.sub(cat_del_repl, content)

# Transform language buttons
lang_btn_pattern = re.compile(r'<Button size="sm" variant="ghost" className="h-8 px-2 text-\[#B8B8B8\] hover:text-white"\s*onClick=\{\(\) => setEditingItem\(\{ \.\.\.lang, isLanguage: true, isEdit: true \}\)\}>\s*Modifier\s*</Button>', re.DOTALL)
content = lang_btn_pattern.sub('', content)

lang_toggle_pattern = re.compile(r'onClick=\{\(\) => handleToggleLanguage\(lang\)\}>\s*\{lang\.isActive \? "D[^"]*sactiver" : "Activer"\}\s*</Button>', re.DOTALL)
lang_toggle_repl = r'''onClick={(e) => { e.stopPropagation(); handleToggleLanguage(lang); }}>
                              <Power className="w-4 h-4" />
                            </Button>'''
content = lang_toggle_pattern.sub(lang_toggle_repl, content)

lang_del_pattern = re.compile(r'onClick=\{\(\) => handleDeleteLanguage\(lang\.code\)\}>\s*Supprimer\s*</Button>', re.DOTALL)
lang_del_repl = r'''onClick={(e) => { e.stopPropagation(); handleDeleteLanguage(lang.code); }}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>'''
content = lang_del_pattern.sub(lang_del_repl, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Regex replaced successfully!')
