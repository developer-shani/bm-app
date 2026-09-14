import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

src_dir = "src"
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".tsx", ".ts", ".js", ".jsx")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
            for line_no, line in enumerate(lines, 1):
                if any(ord(c) > 127 for c in line) or "dY" in line:
                    if not ("/*" in line or "*/" in line or "//" in line):
                        print(f"{filepath}:{line_no}: {line.strip()}")
