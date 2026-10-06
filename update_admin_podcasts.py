import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\podcasts\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add SWR and API imports if missing
if 'import useSWR from "swr";' not in content:
    content = content.replace('import { Button } from "@/components/ui/button";', 'import { Button } from "@/components/ui/button";\nimport useSWR from "swr";\nimport { adminApi } from "@/lib/api";')

swr_hook = '''
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Real API Fetch
  const statusParam = activeTab !== "ALL" ? activeTab : "";
  const { data, isLoading: loading } = useSWR(
    ["/admin/catalog", statusParam, search],
    ([url, s, q]) => adminApi(`${url}?status=${s}&search=${q}`).then(res => res.data)
  );

  const displayedPodcasts = data?.items || [];
  const counts = data?.counts || { ALL: 0, PENDING: 0, PUBLISHED: 0, SUSPENDED: 0 };
  const TABS = [
    { id: "ALL", label: "Tous", count: counts.ALL || displayedPodcasts.length },
    { id: "PENDING", label: "À valider", count: counts.PENDING || 0 },
    { id: "PUBLISHED", label: "Publiés", count: counts.PUBLISHED || 0 },
    { id: "SUSPENDED", label: "Suspendus", count: counts.SUSPENDED || 0 },
  ];
'''

# Find the mock state block
start_idx = content.find('  const [activeTab, setActiveTab] = useState("ALL");')
end_idx = content.find('  const toggleSelectAll = () => {')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + swr_hook + '\n' + content[end_idx:]

# Map the data structure:
# displayedPodcasts map
map_replacement = '''
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => handleRowClick(p.id)}
                      className={`hover:bg-[#1C1C1C] cursor-pointer transition-colors group ${isSelected ? "bg-[#FFBF00]/5" : ""}`}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => toggleSelect(p.id, e as any)}
                          className="w-4 h-4 accent-[#FFBF00] rounded cursor-pointer bg-[#0B0B0B] border-[#2A2A2A]" 
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.cover || p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-[#0B0B0B] border border-[#2A2A2A]" />
                          <div>
                            <p className="font-bold text-white text-sm group-hover:text-[#FFBF00] transition-colors">{p.name}</p>
                            <p className="text-xs text-[#757575] flex items-center gap-1 mt-0.5">
                              {p.languageCode || "N/A"} <span className="opacity-50">·</span> {p.category?.name || "Sans catégorie"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-[#B8B8B8]">{p.creator?.name || p.creatorName || "Inconnu"}</td>
                      <td className="p-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-4 text-sm font-bold text-center text-[#B8B8B8]">{p._count?.episodes || p.episodesCount || 0}</td>
                      <td className="p-4 text-right">
'''
content = content.replace('                  return (\n                    <tr \n                      key={p.id} \n                      onClick={() => handleRowClick(p.id)}\n                      className={`hover:bg-[#1C1C1C] cursor-pointer transition-colors group ${isSelected ? "bg-[#FFBF00]/5" : ""}`}\n                    >\n                      <td className="p-4" onClick={(e) => e.stopPropagation()}>\n                        <input \n                          type="checkbox" \n                          checked={isSelected}\n                          onChange={(e) => toggleSelect(p.id, e as any)}\n                          className="w-4 h-4 accent-[#FFBF00] rounded cursor-pointer bg-[#0B0B0B] border-[#2A2A2A]" \n                        />\n                      </td>\n                      <td className="p-4">\n                        <div className="flex items-center gap-3">\n                          <img src={p.cover} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-[#0B0B0B] border border-[#2A2A2A]" />\n                          <div>\n                            <p className="font-bold text-white text-sm group-hover:text-[#FFBF00] transition-colors">{p.name}</p>\n                            <p className="text-xs text-[#757575] flex items-center gap-1 mt-0.5">\n                              {p.language} <span className="opacity-50">·</span> {p.category}\n                            </p>\n                          </div>\n                        </div>\n                      </td>\n                      <td className="p-4 text-sm font-medium text-[#B8B8B8]">{p.creatorName}</td>\n                      <td className="p-4">\n                        <StatusBadge status={p.status} />\n                      </td>\n                      <td className="p-4 text-sm font-bold text-center text-[#B8B8B8]">{p.episodesCount}</td>\n                      <td className="p-4 text-right">', map_replacement)


map_replacement_mobile = '''
            <div key={p.id} className="p-4 space-y-3" onClick={() => handleRowClick(p.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(p.id)}
                    onChange={(e) => toggleSelect(p.id, e as any)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-[#FFBF00] rounded mt-1" 
                  />
                  <img src={p.cover || p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-[#2A2A2A]" />
                  <div>
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <p className="text-xs text-[#757575]">{p.creator?.name || p.creatorName || "Inconnu"}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-[#757575] -mr-2" onClick={(e) => { e.stopPropagation(); }}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between pl-7">
                <StatusBadge status={p.status} />
                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 bg-[#2A2A2A]/50 text-white hover:bg-[#2A2A2A]" onClick={(e) => { e.stopPropagation(); handleRowClick(p.id); }}>
                  Gérer
                </Button>
              </div>
            </div>
'''
content = content.replace('''            <div key={p.id} className="p-4 space-y-3" onClick={() => handleRowClick(p.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(p.id)}
                    onChange={(e) => toggleSelect(p.id, e as any)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-[#FFBF00] rounded mt-1" 
                  />
                  <img src={p.cover} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-[#2A2A2A]" />
                  <div>
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <p className="text-xs text-[#757575]">{p.creatorName}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-[#757575] -mr-2" onClick={(e) => { e.stopPropagation(); }}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between pl-7">
                <StatusBadge status={p.status} />
                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 bg-[#2A2A2A]/50 text-white hover:bg-[#2A2A2A]" onClick={(e) => { e.stopPropagation(); handleRowClick(p.id); }}>
                  Gérer
                </Button>
              </div>
            </div>''', map_replacement_mobile)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
