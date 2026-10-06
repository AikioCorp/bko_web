import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\components\admin\AdminShell.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace imports
content = content.replace('ChevronLeft, ChevronRight', 'ChevronLeft, ChevronRight, LogOut, ArrowLeft')
content = content.replace('import { useAuthStore } from "@/store/authStore";', 'import { useAuthStore } from "@/store/authStore";\nimport { UserDropdown } from "../UserDropdown";\nimport { useRouter } from "next/navigation";')

# Add useRouter and logout to the component
content = content.replace('const { user } = useAuthStore();', 'const { user, logout } = useAuthStore();\n  const router = useRouter();')

# 1. Move Chevron from bottom to top
top_html = """<div className="flex items-center h-14 px-4 shrink-0 justify-between">
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

content = content.replace("""<div className="flex items-center h-14 px-4 shrink-0 justify-between">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            {isSidebarOpen && <span className="font-bold tracking-tight text-white text-sm">Administration</span>}
          </div>
        </div>""", top_html)

# 2. Change bottom button to logout and "Retour au site"
bottom_html = """<div className="p-3 border-t border-[#262626] shrink-0 space-y-2">
          <Link 
            href="/"
            className={`flex items-center gap-3 w-full h-9 px-2 rounded-md hover:bg-[#1C1C1C] transition-colors text-[#888888] hover:text-white ${isSidebarOpen ? "" : "justify-center"}`}
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Retour au site</span>}
          </Link>
          <button 
            onClick={async () => {
              await logout();
              router.push("/login?tab=login");
            }}
            className={`flex items-center gap-3 w-full h-9 px-2 rounded-md hover:bg-[#1C1C1C] transition-colors text-red-500 hover:text-red-400 ${isSidebarOpen ? "" : "justify-center"}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>"""

old_bottom = """<div className="p-3 border-t border-[#262626] shrink-0">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="flex items-center justify-center w-full h-9 rounded-md hover:bg-[#1C1C1C] transition-colors text-[#888888] hover:text-white"
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>"""

content = content.replace(old_bottom, bottom_html)

# 3. Replace "Quitter l'admin" with <UserDropdown />
header_actions = """<div className="flex items-center gap-4">
            <UserDropdown />
          </div>"""

old_header_actions = """<div className="flex items-center gap-3">
             {/* Retour au site public */}
             <Link href="/" className="text-xs text-[#888] hover:text-white transition-colors">
               Quitter l'admin
             </Link>
          </div>"""

content = content.replace(old_header_actions, header_actions)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
