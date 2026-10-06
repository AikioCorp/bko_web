import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\components\Sidebar.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import React, { useState } from "react";\nimport React, { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
