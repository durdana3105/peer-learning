import os
import re
import glob

migrations_dir = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\peer-learning\\supabase\\migrations'
files = glob.glob(os.path.join(migrations_dir, '*.sql'))

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(
        r'(?i)(SECURITY\s+DEFINER)(?!\s+SET\s+search_path)',
        r'\1 SET search_path = public',
        content
    )
    
    if new_content != content:
        print(f"Updated {os.path.basename(fpath)}")
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
