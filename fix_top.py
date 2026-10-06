import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\components\admin\AdminShell.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

top_html_new = """<div className="flex items-center h-14 px-4 shrink-0 justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold tracking-tight text-white text-sm">Administration</span>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#1C1C1C] transition-colors text-[#888888] hover:text-white shrink-0 ${!isSidebarOpen ? "mx-auto" : ""}`}
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>"""

top_html_old = """<div className="flex items-center h-14 px-4 shrink-0 justify-between">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            {isSidebarOpen && <span className="font-bold tracking-tight text-white text-sm">Administration</span>}
          </div>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#1C1C1C] transition-colors text-[#888888] hover:text-white shrink-0"
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>"""

content = content.replace(top_html_old, top_html_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
