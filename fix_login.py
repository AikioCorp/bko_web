import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\login\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add isNavigating state
content = content.replace('const [loading, setLoading] = useState(false);', 'const [loading, setLoading] = useState(false);\n  const [isNavigating, setIsNavigating] = useState(false);')

# In handleLoginSubmit
submit_success = """      if (json.success && json.data) {
        setIsNavigating(true);
        setAuth(json.data.user, json.data.accessToken, json.data.refreshToken);
        const destination = getDestinationForUser(json.data.user?.roles || [], redirect);
        router.push(destination);
      }"""
content = content.replace("""      if (json.success && json.data) {
        setAuth(json.data.user, json.data.accessToken, json.data.refreshToken);
        const destination = getDestinationForUser(json.data.user?.roles || [], redirect);
        router.push(destination);
      }""", submit_success)

mock_auth_login = """        setAuth(mockUser as any, "mock-token-session");
        const destination = getDestinationForUser(mockUser.roles, redirect);
        router.push(destination);"""
content = content.replace(mock_auth_login, '        setIsNavigating(true);\n' + mock_auth_login)

# In handleRegisterSubmit
mock_auth_register = """        setAuth(mockUser as any, "mock-new-token");
        router.push(isCreator ? "/studio" : "/onboarding");"""
content = content.replace(mock_auth_register, '        setIsNavigating(true);\n' + mock_auth_register)

mock_auth_register_catch = """      setAuth(mockUser as any, "mock-new-token");
      router.push(isCreator ? "/studio" : "/onboarding");"""
content = content.replace(mock_auth_register_catch, '      setIsNavigating(true);\n' + mock_auth_register_catch)

# Render condition
content = content.replace('if (isAuthenticated && user) {', 'if (isAuthenticated && user && !isNavigating) {')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
