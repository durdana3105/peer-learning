import os
import codecs
import argparse

def fix_file(filepath, dry_run=False):
    try:
        with open(filepath, 'rb') as f:
            raw = f.read()
            
        if not raw: return
            
        content = None
        changed = False
        
        if raw.startswith(codecs.BOM_UTF16_LE):
            content = raw[len(codecs.BOM_UTF16_LE):].decode('utf-16-le')
            changed = True
            print(f"Fixed UTF-16 LE: {filepath}")
        elif raw.startswith(codecs.BOM_UTF16_BE):
            content = raw[len(codecs.BOM_UTF16_BE):].decode('utf-16-be')
            changed = True
            print(f"Fixed UTF-16 BE: {filepath}")
        else:
            try:
                content = raw.decode('utf-8')
            except UnicodeDecodeError:
                print(f"Skipping {filepath}: Invalid UTF-8 bytes detected")
                return
                
        if content is None: return
            
        if '\x00' in content:
            content = content.replace('\x00', '')
            print(f"Stripped null bytes: {filepath}")
            changed = True
            
        if changed:
            if dry_run:
                print(f"[Dry Run] Would update {filepath}")
            else:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
            
    except Exception as e:
        print(f"Failed {filepath}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Fix file encodings and null bytes.")
    parser.add_argument('--dry-run', action='store_true', help="Report which files would be changed without writing them")
    args = parser.parse_args()

    for root, _, files in os.walk('.'):
        if 'node_modules' in root or '.git' in root or 'dist' in root or 'coverage' in root or 'uploads' in root:
            continue
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json', '.html', '.txt')):
                fix_file(os.path.join(root, file), dry_run=args.dry_run)

if __name__ == '__main__':
    main()
