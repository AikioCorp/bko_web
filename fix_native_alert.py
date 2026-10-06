import sys, re

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\categories\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add `deletingItem` state
state_injection = """  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);"""
content = content.replace('  const [editingItem, setEditingItem] = useState<any>(null);', state_injection)

# 2. Update delete logic to be confirm delete logic
del_cat = """  const confirmDeleteCategory = async (id: string) => {
    try {
      const res = await adminApi(`/admin/categories/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message || "Erreur de suppression");
      mutateCategories();
      setDeletingItem(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };"""
content = re.sub(r'  const handleDeleteCategory = async \(id: string\) => \{[^}]+\}[^}]+\};', del_cat, content, count=1)

del_lang = """  const confirmDeleteLanguage = async (code: string) => {
    try {
      const res = await adminApi(`/admin/languages/${code}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message || "Erreur de suppression");
      mutateLanguages();
      setDeletingItem(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };"""
content = re.sub(r'  const handleDeleteLanguage = async \(code: string\) => \{[^}]+\}[^}]+\};', del_lang, content, count=1)

# 3. Update onClick handlers
content = content.replace('handleDeleteCategory(cat.id)', 'setDeletingItem({ id: cat.id, isCategory: true, name: cat.name })')
content = content.replace('handleDeleteLanguage(lang.code)', 'setDeletingItem({ code: lang.code, isLanguage: true, name: lang.name })')

# 4. Add deleting modal UI right before the editing modal
deleting_modal = """
      {/* Deletion Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setDeletingItem(null)}>
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Confirmer la suppression</h2>
            <p className="text-[#888888] text-sm mb-6">
              Voulez-vous vraiment supprimer {deletingItem.isCategory ? "la catégorie" : "la langue"} <strong className="text-white">{deletingItem.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" className="text-[#B8B8B8] hover:text-white" onClick={() => setDeletingItem(null)}>Annuler</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => {
                  if (deletingItem.isCategory) confirmDeleteCategory(deletingItem.id);
                  else confirmDeleteLanguage(deletingItem.code);
              }}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}
"""
content = content.replace('{/* Editor Modal */}', deleting_modal + '\n      {/* Editor Modal */}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
