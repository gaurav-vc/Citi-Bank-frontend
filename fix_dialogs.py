import os
import re

directory = 'd:/Downloads/campusspend-manager/frontend/src'

count = 0
files_modified = []

# Regex to find DialogHeader blocks
header_pattern = re.compile(r'(<DialogHeader>.*?<DialogTitle[^>]*>.*?</DialogTitle>)(.*?)(</DialogHeader>)', re.DOTALL)
content_pattern = re.compile(r'(<DialogContent[^>]*)>')

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content

            # Fix missing DialogDescriptions
            def replace_header(match):
                prefix = match.group(1)
                inner = match.group(2)
                suffix = match.group(3)
                if '<DialogDescription' not in inner and '<DialogDescription' not in prefix:
                    # Inject a generic but appropriate description
                    title_match = re.search(r'<DialogTitle[^>]*>(.*?)</DialogTitle>', prefix, re.DOTALL)
                    desc_text = "Please review and complete the details below."
                    if title_match:
                        title_text = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
                        if '{' not in title_text and len(title_text) > 0:
                            desc_text = f"Manage {title_text.lower()} details and actions here."
                            
                    return f'{prefix}\n            <DialogDescription className="text-sm text-muted-foreground">{desc_text}</DialogDescription>{inner}{suffix}'
                return match.group(0)

            content = header_pattern.sub(replace_header, content)

            # Fix imports
            if '<DialogDescription' in content and 'DialogDescription' not in original_content:
                content = re.sub(r'import\s+{([^}]*DialogTitle[^}]*)}\s+from\s+[\'"]@/components/ui/dialog[\'"]', 
                                 r'import { \1, DialogDescription } from "@/components/ui/dialog"', content)
                content = re.sub(r'import\s+{([^}]*DialogContent[^}]*)}\s+from\s+[\'"]@/components/ui/dialog[\'"]', 
                                 r'import { \1, DialogDescription } from "@/components/ui/dialog"', content)
                                 
                import_match = re.search(r'import\s+{([^}]+)}\s+from\s+[\'"]@/components/ui/dialog[\'"]', content)
                if import_match:
                    parts = [p.strip() for p in import_match.group(1).split(',')]
                    parts = list(dict.fromkeys(parts)) # remove duplicates
                    content = content.replace(import_match.group(0), f'import {{ {", ".join(parts)} }} from "@/components/ui/dialog"')

            # Find DialogContents that have no DialogHeader inside them OR where we couldn't inject a description
            # Actually, to be perfectly safe, if a DialogContent doesn't contain a DialogHeader, we must add aria-describedby
            # A safer way: just add aria-describedby={undefined} to any <DialogContent> that is in a file without <DialogDescription>
            # OR we can just add aria-describedby={undefined} if it's missing, but that overrides screen readers if a description exists elsewhere.
            # Best is to check if `<DialogDescription` exists in the entire Dialog block.
            
            # Simple approach: If a file uses <DialogContent> but there's absolutely no <DialogHeader> in the entire file, add aria-describedby={undefined}
            if '<DialogContent' in content and '<DialogHeader' not in content:
                content = re.sub(r'<DialogContent(?!\s+aria-describedby)([^>]*)>', r'<DialogContent aria-describedby={undefined}\1>', content)

            # Special case for DialogContents that are isolated
            def replace_content(match):
                full_tag = match.group(0)
                if 'aria-describedby' not in full_tag and '<DialogHeader' not in content:
                     return full_tag.replace('<DialogContent', '<DialogContent aria-describedby={undefined}')
                return full_tag
            
            # Use another regex to find DialogContent blocks and verify if they have DialogHeader inside them.
            dialog_blocks = re.split(r'(<DialogContent)', content)
            new_content = dialog_blocks[0]
            for i in range(1, len(dialog_blocks), 2):
                tag_start = dialog_blocks[i]
                rest = dialog_blocks[i+1]
                
                # Check if there's a DialogHeader before the closing </DialogContent>
                end_idx = rest.find('</DialogContent>')
                if end_idx != -1:
                    inner_content = rest[:end_idx]
                    if '<DialogHeader' not in inner_content and '<DialogDescription' not in inner_content:
                        # add aria-describedby to the tag start
                        # wait, the rest string starts with ` className="..." >...`
                        # let's just insert it at the beginning of `rest` before `>`
                        bracket_idx = rest.find('>')
                        if bracket_idx != -1 and 'aria-describedby' not in rest[:bracket_idx]:
                            rest = ' aria-describedby={undefined}' + rest
                
                new_content += tag_start + rest
            
            content = new_content

            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
                files_modified.append(filepath)

print(f"Modified {count} files:")
for f in files_modified:
    print(f)
