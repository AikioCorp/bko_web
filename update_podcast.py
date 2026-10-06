import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\podcasts\[slug]\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to add addToQueue to usePlayerStore
if 'addToQueue' not in content:
    content = content.replace('const { currentEpisode, isPlaying, playEpisode, togglePlay } = usePlayerStore();', 'const { currentEpisode, isPlaying, playEpisode, togglePlay, addToQueue } = usePlayerStore();')

queue_button = '''
                        <button
                          onClick={(e) => { e.preventDefault(); addToQueue(toPlayerEpisode(ep, podcast)); }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-[#B8B8B8] hover:text-[#FFBF00] hover:bg-[#FFBF00]/10 rounded-full transition-all"
                          title="Ajouter à la file d'attente"
                        >
                          <ListMusic className="w-4 h-4" />
                        </button>
'''

if 'ListMusic' not in content:
    content = content.replace('import { Play, Pause, Bookmark, Star, Share2 }', 'import { Play, Pause, Bookmark, Star, Share2, ListMusic }')
    # Find the Bookmark save button
    #                         <button className="opacity-0 group-hover:opacity-100 p-2 text-[#B8B8B8] hover:text-white rounded-full transition-all">
    #                           <Bookmark className="w-4 h-4" />
    #                         </button>
    content = content.replace('<button className="opacity-0 group-hover:opacity-100 p-2 text-[#B8B8B8] hover:text-white rounded-full transition-all">\n                          <Bookmark className="w-4 h-4" />\n                        </button>', queue_button + '\n                        <button className="opacity-0 group-hover:opacity-100 p-2 text-[#B8B8B8] hover:text-white rounded-full transition-all">\n                          <Bookmark className="w-4 h-4" />\n                        </button>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
