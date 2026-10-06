import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\components\UserDropdown.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_profil_link = """<Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#B8B8B8] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Mon Profil</span>
                </Link>"""

new_profil_link = """<Link
                  href={canAccessConsole ? "/admin/profile" : (isCreator ? "/studio/profile" : "/profile")}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#B8B8B8] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Mon Profil</span>
                </Link>"""

content = content.replace(old_profil_link, new_profil_link)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
