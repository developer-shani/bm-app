with open("src/app/globals.css", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find where /* ====== Center Popup Toast Styles ====== */ starts
cutoff = len(lines)
for i, line in enumerate(lines):
    if "Center Popup Toast Styles" in line or "center toast" in line.lower():
        cutoff = i
        break

clean_lines = lines[:cutoff]

clean_css = "".join(clean_lines) + """
/* ====== Sleek Floating Toast Notifications ====== */
[data-sonner-toaster] {
  font-family: inherit !important;
}

[data-sonner-toast] {
  border-radius: 1rem !important;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
"""

with open("src/app/globals.css", "w", encoding="utf-8") as f:
    f.write(clean_css)

print("2. globals.css updated!")
