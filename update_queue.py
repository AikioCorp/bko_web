import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\podcasts\[slug]\episodes\[episodeSlug]\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to add addToQueue to usePlayerStore
if 'addToQueue' not in content:
    content = content.replace('const { currentEpisode, isPlaying, playEpisode, togglePlay, seek } = usePlayerStore();', 'const { currentEpisode, isPlaying, playEpisode, togglePlay, seek, addToQueue } = usePlayerStore();')

queue_button = '''
            <button onClick={() => addToQueue(toPlayerEpisode(ep, ep.podcast))} className="text-[#B8B8B8] hover:text-[#FFBF00] p-2" aria-label="Ajouter à la file d'attente">
              <ListMusic className="w-5 h-5" />
            </button>
'''

if 'ListMusic' not in content:
    content = content.replace('import { Play, Pause, Share2, Bookmark, BookmarkCheck }', 'import { Play, Pause, Share2, Bookmark, BookmarkCheck, ListMusic }')
    content = content.replace('<button onClick={toggleSave}', queue_button + '\n            <button onClick={toggleSave}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
