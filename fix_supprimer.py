import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

delete_methods = """  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette catégorie définitivement ?")) return;
    try {
      const res = await adminApi(`/admin/categories/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message || "Erreur de suppression");
      mutateCategories();
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleDeleteLanguage = async (code: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette langue définitivement ?")) return;
    try {
      const res = await adminApi(`/admin/languages/${code}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message || "Erreur de suppression");
      mutateLanguages();
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };
"""

if 'handleDeleteCategory' not in content:
    content = content.replace('  const handleToggleCategory = async (cat: any) => {', delete_methods + '\n  const handleToggleCategory = async (cat: any) => {')

cat_actions = """<Button size="sm" variant="ghost" className="h-8 px-2 text-[#B8B8B8] hover:text-white" onClick={() => handleToggleCategory(cat)}>
                              {cat.isActive ? "Désactiver" : "Activer"}
                            </Button>
                            {cat._count?.podcasts === 0 && (
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-400" onClick={() => handleDeleteCategory(cat.id)}>
                                Supprimer
                              </Button>
                            )}"""
content = content.replace('<Button size="sm" variant="ghost" className="h-8 px-2 text-[#B8B8B8] hover:text-white" onClick={() => handleToggleCategory(cat)}>\n                              {cat.isActive ? "Désactiver" : "Activer"}\n                            </Button>', cat_actions)
# fallback for funky spaces:
content = content.replace('DǸsactiver', 'Désactiver')
content = content.replace('<Button size="sm" variant="ghost" className="h-8 px-2 text-[#B8B8B8] hover:text-white" onClick={() => handleToggleCategory(cat)}>\n                              {cat.isActive ? "Désactiver" : "Activer"}\n                            </Button>', cat_actions)

lang_actions = """<Button size="sm" variant="ghost" className="h-8 px-2 text-[#B8B8B8] hover:text-white" onClick={() => handleToggleLanguage(lang)}>
                              {lang.isActive ? "Désactiver" : "Activer"}
                            </Button>
                            {(lang._count?.primaryPodcasts || 0) + (lang._count?.secondaryPodcasts || 0) === 0 && (
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-400" onClick={() => handleDeleteLanguage(lang.code)}>
                                Supprimer
                              </Button>
                            )}"""
content = content.replace('<Button size="sm" variant="ghost" className="h-8 px-2 text-[#B8B8B8] hover:text-white" onClick={() => handleToggleLanguage(lang)}>\n                              {lang.isActive ? "Désactiver" : "Activer"}\n                            </Button>', lang_actions)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
