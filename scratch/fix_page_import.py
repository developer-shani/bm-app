with open("src/app/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

old_import = 'import { Smartphone, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";'
new_import = 'import { Smartphone, Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, Wallet, Handshake } from "lucide-react";'

if old_import in text:
    text = text.replace(old_import, new_import)
    with open("src/app/page.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Added Lucide imports to src/app/page.tsx successfully!")
else:
    print("WARNING: old_import not found!")
