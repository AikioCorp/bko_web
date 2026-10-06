import sys, re

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace category delete function
cat_delete_pattern = re.compile(r'const handleDeleteCategory = async \(id: string\) => \{.*?\}\s*catch\s*\(e: any\)\s*\{\s*alert\(\"Erreur: \" \+ e\.message\);\s*\}\s*\};', re.DOTALL)
cat_delete_repl = r'''const confirmDeleteCategory = async (id: string) => {
    try {
      const res = await adminApi(`/admin/categories/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message || "Erreur de suppression");
      mutateCategories();
      setDeletingItem(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };'''

content = cat_delete_pattern.sub(cat_delete_repl, content)


# Replace language delete function
lang_delete_pattern = re.compile(r'const handleDeleteLanguage = async \(code: string\) => \{.*?\}\s*catch\s*\(e: any\)\s*\{\s*alert\(\"Erreur: \" \+ e\.message\);\s*\}\s*\};', re.DOTALL)
lang_delete_repl = r'''const confirmDeleteLanguage = async (code: string) => {
    try {
      const res = await adminApi(`/admin/languages/${code}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message || "Erreur de suppression");
      mutateLanguages();
      setDeletingItem(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };'''

content = lang_delete_pattern.sub(lang_delete_repl, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
