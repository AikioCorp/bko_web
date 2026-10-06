import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

delete_method = """  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette catégorie définitivement ?")) return;
    try {
      const res = await adminApi(`/admin/categories/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.error || res.message);
      mutateCategories();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteLanguage = async (code: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette langue définitivement ?")) return;
    try {
      const res = await adminApi(`/admin/languages/${code}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.error || res.message);
      mutateLanguages();
    } catch (e: any) {
      alert(e.message);
    }
  };
"""

if 'handleDeleteCategory' not in content:
    content = content.replace('  const toggleLanguageStatus =', delete_method + '\n  const toggleLanguageStatus =')

cat_actions = """<button onClick={() => openEditCategory(cat)} className="hover:text-white">Modifier</button>
                    <button onClick={() => toggleCategoryStatus(cat.id, cat.isActive)} className="hover:text-white">
                      {cat.isActive ? "Désactiver" : "Activer"}
                    </button>
                    {cat._count?.podcasts === 0 && (
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-400">Supprimer</button>
                    )}"""
content = content.replace("""<button onClick={() => openEditCategory(cat)} className="hover:text-white">Modifier</button>
                    <button onClick={() => toggleCategoryStatus(cat.id, cat.isActive)} className="hover:text-white">
                      {cat.isActive ? "Désactiver" : "Activer"}
                    </button>""", cat_actions)

lang_actions = """<button onClick={() => openEditLanguage(lang)} className="hover:text-white">Modifier</button>
                    <button onClick={() => toggleLanguageStatus(lang.code, lang.isActive)} className="hover:text-white">
                      {lang.isActive ? "Désactiver" : "Activer"}
                    </button>
                    {(lang._count?.primaryPodcasts || 0) + (lang._count?.secondaryPodcasts || 0) === 0 && (
                      <button onClick={() => handleDeleteLanguage(lang.code)} className="text-red-500 hover:text-red-400">Supprimer</button>
                    )}"""
content = content.replace("""<button onClick={() => openEditLanguage(lang)} className="hover:text-white">Modifier</button>
                    <button onClick={() => toggleLanguageStatus(lang.code, lang.isActive)} className="hover:text-white">
                      {lang.isActive ? "Désactiver" : "Activer"}
                    </button>""", lang_actions)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
