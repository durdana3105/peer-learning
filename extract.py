import json, re

paths = [
    ('C:\\Users\\user\\.gemini\\antigravity\\brain\\6d88a5e7-0a1f-49ac-a544-654b19bcb369\\.system_generated\\steps\\2002\\content.md', 401),
    ('C:\\Users\\user\\.gemini\\antigravity\\brain\\6d88a5e7-0a1f-49ac-a544-654b19bcb369\\.system_generated\\steps\\2003\\content.md', 402)
]

for p, num in paths:
    with open(p, encoding='utf-8') as f:
        content = f.read()
        match = re.search(r'"articleBody":"(.*?)"', content)
        if match:
            # Handle unicode escapes safely
            body = bytes(match.group(1), "utf-8").decode("unicode_escape")
            print(f"Issue {num}: {body}\n")
