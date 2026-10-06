import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\login\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

checkbox_html = '''
              {/* Creator Checkbox */}
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCreator}
                    onChange={(e) => setIsCreator(e.target.checked)}
                    className="w-4 h-4 accent-[#FFBF00] cursor-pointer"
                  />
                  <span className="text-sm font-bold text-white">Je suis créateur de contenu</span>
                </label>
                {isCreator && (
                  <div className="pt-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-white">Nom de votre Podcast</label>
                      <span className="text-[10px] text-[#757575]">Optionnel</span>
                    </div>
                    <div className="relative flex items-center">
                      <Headphones className="w-4 h-4 text-[#757575] absolute left-3.5" />
                      <input
                        type="text"
                        value={podcastName}
                        onChange={(e) => setPodcastName(e.target.value)}
                        placeholder="ex: Le Bamako Show"
                        className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-10 pr-4 outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
'''

search_string = '              {/* Submit Button */}'

if search_string in content:
    content = content.replace(search_string, checkbox_html + '\n' + search_string)
else:
    print("Could not find the target to insert.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fix done")
