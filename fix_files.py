import os
import codecs

def fix_file(filepath):
    try:
        with open(filepath, 'rb') as f:
            raw = f.read()
            
        if not raw: return
            
        content = None
        if raw.startswith(codecs.BOM_UTF16_LE):
            content = raw.decode('utf-16-le')
            print(f"Fixed UTF-16 LE: {filepath}")
        elif raw.startswith(codecs.BOM_UTF16_BE):
            content = raw.decode('utf-16-be')
            print(f"Fixed UTF-16 BE: {filepath}")
        else:
            try:
                content = raw.decode('utf-8')
            except UnicodeDecodeError:
                content = raw.decode('utf-8', errors='ignore')
                
        if content is None: return
        
        changed = False
        if raw.startswith(codecs.BOM_UTF16_LE) or raw.startswith(codecs.BOM_UTF16_BE):
            changed = True
            
        if '\x00' in content:
            content = content.replace('\x00', '')
            print(f"Stripped null bytes: {filepath}")
            changed = True
            
        if changed:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
    except Exception as e:
        print(f"Failed {filepath}: {e}")

for root, _, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'dist' in root or 'coverage' in root or 'uploads' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json', '.html', '.txt')):
            fix_file(os.path.join(root, file))
