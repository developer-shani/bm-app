with open("src/app/dashboard/users/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

old_dialog = """              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Portal Link:</span>
                <span className="font-mono text-[11px] text-muted-foreground">http://localhost:3000/</span>
              </div>"""

new_dialog = """              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Portal Link:</span>
                <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">
                  {typeof window !== "undefined" ? window.location.origin : "https://bm-app.vercel.app"}
                </span>
              </div>"""

if old_dialog in text:
    text = text.replace(old_dialog, new_dialog)
    with open("src/app/dashboard/users/page.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Dialog portal link patched successfully!")
else:
    print("Dialog portal link already patched or custom!")
