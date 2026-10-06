import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\admin\podcasts\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

swr_replacement = '''
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  
  // Real API Fetch
  const statusParam = activeTab !== "ALL" ? activeTab : "";
  const { data, isLoading: loading } = useSWR(
    ["/admin/catalog", statusParam, search, page, limit],
    ([url, s, q, p, l]) => adminApi(`${url}?status=${s}&search=${q}&page=${p}&limit=${l}`).then(res => res.data)
  );

  const displayedPodcasts = data?.items || [];
  const totalItems = data?.total || displayedPodcasts.length;
  const counts = data?.counts || { ALL: 0, PENDING: 0, PUBLISHED: 0, SUSPENDED: 0 };
  const TABS = [
    { id: "ALL", label: "Tous", count: counts.ALL || displayedPodcasts.length },
    { id: "PENDING", label: "À valider", count: counts.PENDING || 0 },
    { id: "PUBLISHED", label: "Publiés", count: counts.PUBLISHED || 0 },
    { id: "SUSPENDED", label: "Suspendus", count: counts.SUSPENDED || 0 },
  ];

  const totalPages = limit === 1000 ? 1 : Math.ceil(totalItems / limit);
  
  // Reset page when tab, search or limit changes
  React.useEffect(() => { setPage(1); }, [activeTab, search, limit]);
'''

start_idx = content.find('  const [activeTab, setActiveTab] = useState("ALL");')
end_idx = content.find('  const toggleSelectAll = () => {')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + swr_replacement + '\n' + content[end_idx:]

# Table min-height to avoid jumping footer
content = content.replace('<div className="hidden md:block overflow-x-auto">', '<div className="hidden md:block overflow-x-auto min-h-[500px]">')

# Pagination footer replacement
pagination_footer = '''
        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#2A2A2A] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#757575] bg-[#171717]">
          <div className="flex items-center gap-3">
            <span>Afficher par page:</span>
            <select 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-[#0B0B0B] border border-[#2A2A2A] rounded px-2 py-1 text-white outline-none focus:border-[#FFBF00]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={1000}>Tous</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <span>{displayedPodcasts.length > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, totalItems)} sur {totalItems}</span>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-7 px-2 text-[#757575] hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                disabled={page >= totalPages || loading}
                onClick={() => setPage(p => p + 1)}
                className="h-7 px-2 text-[#B8B8B8] hover:text-white disabled:opacity-50"
              >
                Suivant <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
'''

start_footer = content.find('        {/* Pagination Footer */}')
end_footer = content.find('      </div>\n    </div>')

if start_footer != -1 and end_footer != -1:
    content = content[:start_footer] + pagination_footer + '\n' + content[end_footer:]


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
