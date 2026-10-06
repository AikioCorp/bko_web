import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\studio\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I will add a mock state to check if they have a podcast
if 'const [hasPodcast, setHasPodcast] = useState(false);' not in content:
    content = content.replace('  const { user } = useAuthStore();', '  const { user } = useAuthStore();\n  const [hasPodcast, setHasPodcast] = useState(false); // TODO: fetch from backend')

blank_state = '''
  if (!hasPodcast) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-[#1A1A1A] rounded-full flex items-center justify-center border border-[#2A2A2A]">
          <Mic className="w-10 h-10 text-[#FFBF00]" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-extrabold text-white">Bienvenue dans votre Studio</h1>
          <p className="text-[#888888] text-base leading-relaxed">
            Il semble que vous n'ayez pas encore de podcast. Créez-en un maintenant pour commencer à publier vos épisodes et bâtir votre audience.
          </p>
        </div>
        <Link href="/studio/onboarding">
          <Button className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold px-8 py-6 rounded-full text-base shadow-lg transition-transform hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5 mr-2" />
            Créer mon premier podcast
          </Button>
        </Link>
      </div>
    );
  }

  return ('''

content = content.replace('  return (\n    <div ref={pageRef} className="space-y-8 pb-12">', blank_state + '\n    <div ref={pageRef} className="space-y-8 pb-12">')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
