import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\components\Sidebar.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import_replacement = 'import React, { useState, useEffect } from "react";\nimport Link from "next/link";'
content = content.replace('import Link from "next/link";', import_replacement)

hook_injection = """  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const isAdmin = isMounted && isAuthenticated && Boolean(
    user?.roles?.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r.toUpperCase()))
  );
  
  const isCreator = isMounted && isAuthenticated && Boolean(
    user?.roles?.includes("CREATOR") ||
    user?.roles?.includes("ADMIN") ||
    user?.permissions?.includes("publish:episodes")
  );"""

old_hook = """  const isAdmin = isAuthenticated && Boolean(
    user?.roles?.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r.toUpperCase()))
  );
  
  const isCreator = isAuthenticated && Boolean(
    user?.roles?.includes("CREATOR") ||
    user?.roles?.includes("ADMIN") ||
    user?.permissions?.includes("publish:episodes")
  );"""

content = content.replace(old_hook, hook_injection)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
