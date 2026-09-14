import os
import re

def fix_page_tsx():
    filepath = "src/app/page.tsx"
    with open(filepath, "r", encoding="utf-8-sig", errors="ignore") as f:
        content = f.read()

    # Ensure Lucide imports in page.tsx include ShieldCheck, Wallet, Handshake, Sparkles
    if "ShieldCheck" not in content:
        content = content.replace(
            'import { Lock, Mail, ArrowRight, Loader2, Sparkles, Smartphone } from "lucide-react";',
            'import { Lock, Mail, ArrowRight, Loader2, Sparkles, Smartphone, ShieldCheck, Wallet, Handshake } from "lucide-react";'
        )

    # Fix Quick Demo Login header & button labels
    content = re.sub(r'âš¡ Quick Demo Login', '⚡ Quick Demo Login', content)
    content = re.sub(r'ðŸ‘‘\s*Admin', '<ShieldCheck className="w-4 h-4 mr-1.5 inline" /> Admin', content)
    content = re.sub(r'ðŸ’¼\s*Investor', '<Wallet className="w-4 h-4 mr-1.5 inline" /> Investor', content)
    content = re.sub(r'ðŸ“±\s*Reseller', '<Handshake className="w-4 h-4 mr-1.5 inline" /> Reseller', content)

    # Replace any leftover corrupted tokens
    content = content.replace('âš¡', '⚡')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed src/app/page.tsx")

def fix_users_page_tsx():
    filepath = "src/app/dashboard/users/page.tsx"
    with open(filepath, "r", encoding="utf-8-sig", errors="ignore") as f:
        content = f.read()

    # Fix WhatsApp template text
    content = re.sub(r'ðŸ”‘|ðŸ‘¤|ðŸ›¡ï¸ |ðŸ“§|ðŸ”’|ðŸŒ ', '', content)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed src/app/dashboard/users/page.tsx")

def fix_customers_new_tsx():
    filepath = "src/app/dashboard/customers/new/page.tsx"
    with open(filepath, "r", encoding="utf-8-sig", errors="ignore") as f:
        content = f.read()

    content = re.sub(r'ðŸ”‘|ðŸ‘¤|ðŸ›¡ï¸ |ðŸ“§|ðŸ”’|ðŸŒ ', '', content)
    content = content.replace('â€”', '—')
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed src/app/dashboard/customers/new/page.tsx")

def fix_recovery_tsx():
    filepath = "src/app/dashboard/recovery/page.tsx"
    with open(filepath, "r", encoding="utf-8-sig", errors="ignore") as f:
        content = f.read()

    content = re.sub(r'ðŸ§¾|ðŸ™ ', '', content)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed src/app/dashboard/recovery/page.tsx")

def strip_bom_all():
    src_dir = "src"
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith((".tsx", ".ts", ".js", ".jsx", ".css")):
                filepath = os.path.join(root, file)
                with open(filepath, "rb") as f:
                    data = f.read()
                if data.startswith(b'\xef\xbb\xbf'):
                    data = data[3:]
                    with open(filepath, "wb") as f:
                        f.write(data)

fix_page_tsx()
fix_users_page_tsx()
fix_customers_new_tsx()
fix_recovery_tsx()
strip_bom_all()
print("All corruptions fixed cleanly!")
