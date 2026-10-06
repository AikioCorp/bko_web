import sys, re

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace category button
cat_pattern = re.compile(r'(<Button[^>]+onClick=\{\(\) => handleToggleCategory\(cat\)\}[^>]*>.*?</Button>)', re.DOTALL)
cat_replacement = r'''\1
                            {cat._count?.podcasts === 0 && (
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-400" onClick={() => handleDeleteCategory(cat.id)}>
                                Supprimer
                              </Button>
                            )}'''
content = cat_pattern.sub(cat_replacement, content)

# Replace language button
lang_pattern = re.compile(r'(<Button[^>]+onClick=\{\(\) => handleToggleLanguage\(lang\)\}[^>]*>.*?</Button>)', re.DOTALL)
lang_replacement = r'''\1
                            {(lang._count?.primaryPodcasts || 0) + (lang._count?.secondaryPodcasts || 0) === 0 && (
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-400" onClick={() => handleDeleteLanguage(lang.code)}>
                                Supprimer
                              </Button>
                            )}'''
content = lang_pattern.sub(lang_replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Regex replaced successfully!')
