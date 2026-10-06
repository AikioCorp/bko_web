import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\login\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The string to remove:
#               {/* Langues d'écoute préférées */}
#               <div className="space-y-1.5 pt-1">
#                  ...
#               </div>

import re

# We can just use a regex to match the Langues d'écoute block until the next comment or </div>
pattern = r'\{\/\* Langues d\'écoute préférées \*\/\}.*?<\/div>\s*<\/div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# Update the redirect in fallback to push to /onboarding instead of redirect (for listeners)
# router.push(isCreator ? "/studio" : redirect);
content = content.replace(
    'router.push(isCreator ? "/studio" : redirect);',
    'router.push(isCreator ? "/studio" : "/onboarding");'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
