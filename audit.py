import os
import re
import glob

migrations_dir = 'C:/Users/user/.gemini/antigravity/scratch/peer-learning/supabase/migrations'
files = glob.glob(os.path.join(migrations_dir, '*.sql'))
files.sort()

policies = []
functions = []
tables = []
rls_enabled = set()

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
        # Extract tables
        for match in re.finditer(r'(?i)create\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_\.]+)', content):
            tables.append(match.group(1).replace('public.', '').strip())
            
        # Extract RLS enable
        for match in re.finditer(r'(?i)alter\s+table\s+([a-zA-Z0-9_\.]+)\s+enable\s+row\s+level\s+security', content):
            rls_enabled.add(match.group(1).replace('public.', '').strip())
            
        # Extract policies
        for match in re.finditer(r'(?i)create\s+policy\s+"([^"]+)"\s+(?:on\s+)?([a-zA-Z0-9_\.]+)\s+for\s+(select|insert|update|delete)\s+to\s+([a-zA-Z0-9_\.]+)\s*(using\s*\([^;]+|with\s+check\s*\([^;]+|);', content):
            policies.append({
                'file': os.path.basename(f),
                'policy_name': match.group(1),
                'table': match.group(2).replace('public.', ''),
                'action': match.group(3).lower(),
                'role': match.group(4),
                'condition': match.group(5).strip() if match.group(5) else ''
            })
            
        # Extract functions
        for match in re.finditer(r'(?i)create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z0-9_\.]+)\s*\(([^)]*)\).*?(?:language\s+[a-zA-Z]+)(.*?)(?:as\s+\$\$(.*?)\$\$)', content, re.DOTALL):
            functions.append({
                'file': os.path.basename(f),
                'name': match.group(1).replace('public.', ''),
                'args': match.group(2),
                'modifiers': match.group(3).strip(),
                'body': match.group(4).strip()
            })

with open('audit_report.txt', 'w', encoding='utf-8') as out:
    out.write("--- Missing RLS ---\n")
    for t in tables:
        if t not in rls_enabled:
            out.write(f"Table {t} might be missing RLS (or enabled in another file, check manually)\n")
            
    out.write("\n--- Policies ---\n")
    for p in policies:
        out.write(f"[{p['file']}] {p['table']} ({p['action']}): {p['policy_name']}\n{p['condition']}\n\n")
        
    out.write("\n--- Functions ---\n")
    for f in functions:
        out.write(f"[{f['file']}] {f['name']}({f['args']})\nModifiers: {f['modifiers']}\n\n")
