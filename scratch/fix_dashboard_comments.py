with open("src/app/dashboard/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("# 2. Real-time", "// 2. Real-time")
text = text.replace("# 3. Real-time", "// 3. Real-time")
text = text.replace("# 4. Real-time", "// 4. Real-time")

with open("src/app/dashboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Dashboard comments fixed!")
