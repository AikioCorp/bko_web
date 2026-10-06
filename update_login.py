import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\login\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
content = content.replace(
    '  const [showRegisterPassword, setShowRegisterPassword] = useState(false);\n  const [selectedLanguages',
    '  const [showRegisterPassword, setShowRegisterPassword] = useState(false);\n  const [isCreator, setIsCreator] = useState(false);\n  const [podcastName, setPodcastName] = useState("");\n  const [selectedLanguages'
)

# Update fetch body
fetch_body_old = '''        body: JSON.stringify({
          fullName: fullName.trim(),
          email: registerEmail.trim(),
          phoneNumber: phoneNumber ? `+223${phoneNumber.replace(/\s+/g, "")}` : undefined,
          password: registerPassword,
        }),'''
fetch_body_new = '''        body: JSON.stringify({
          fullName: fullName.trim(),
          email: registerEmail.trim(),
          phoneNumber: phoneNumber ? `+223${phoneNumber.replace(/\s+/g, "")}` : undefined,
          password: registerPassword,
          isCreator,
          podcastName: isCreator ? podcastName.trim() : undefined,
        }),'''
content = content.replace(fetch_body_old, fetch_body_new)

# Update mockUser roles
content = content.replace('roles: ["LISTENER"],', 'roles: isCreator ? ["LISTENER", "CREATOR"] : ["LISTENER"],')

# Update redirect for mockUser
content = content.replace('router.push(redirect);', 'router.push(isCreator ? "/studio" : redirect);')

# Add checkbox html before submit button
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
content = content.replace('            <button\n              type="submit"', f'{checkbox_html}\n            <button\n              type="submit"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
