with open("src/hooks/use-auth.tsx", "r", encoding="utf-8-sig") as f:
    text = f.read()

text = text.replace('const SUPER_ADMIN_UID = "EtIGZIxms6hrS5uR96fmxksjEDv1";\n"use client";', '"use client";\n\nconst SUPER_ADMIN_UID = "EtIGZIxms6hrS5uR96fmxksjEDv1";')
text = text.replace('const SUPER_ADMIN_UID = "EtIGZIxms6hrS5uR96fmxksjEDv1";\n\ufeff"use client";', '"use client";\n\nconst SUPER_ADMIN_UID = "EtIGZIxms6hrS5uR96fmxksjEDv1";')

with open("src/hooks/use-auth.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Placed 'use client' at top of use-auth.tsx!")
