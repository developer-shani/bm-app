import re

def clean_file(filepath):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()

    # Remove any non-ASCII characters in template strings
    cleaned = ""
    for char in text:
        if ord(char) < 128 or char in "—\n\r\t":
            cleaned += char
        else:
            cleaned += " "

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(cleaned)

clean_file("src/app/dashboard/users/page.tsx")
clean_file("src/app/dashboard/customers/new/page.tsx")
clean_file("src/app/dashboard/recovery/page.tsx")

print("Templates cleaned completely!")
