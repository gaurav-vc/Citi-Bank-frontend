import os

dir_path = r'src/pages'

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    # Common variations of the role check
    content = content.replace("user.role === 'cxo'", "['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role)")
    content = content.replace("user?.role === 'cxo'", "['cxo', 'cxo_citi', 'cxo_emb'].includes(user?.role || '')")
    content = content.replace("role === 'cxo'", "['cxo', 'cxo_citi', 'cxo_emb'].includes(role || '')")
    content = content.replace("roleName === 'cxo'", "['cxo', 'cxo_citi', 'cxo_emb'].includes(roleName || '')")

    # Double quote variants
    content = content.replace('user.role === "cxo"', "['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role)")
    content = content.replace('user?.role === "cxo"', "['cxo', 'cxo_citi', 'cxo_emb'].includes(user?.role || '')")
    content = content.replace('role === "cxo"', "['cxo', 'cxo_citi', 'cxo_emb'].includes(role || '')")
    content = content.replace('roleName === "cxo"', "['cxo', 'cxo_citi', 'cxo_emb'].includes(roleName || '')")
    
    if orig != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filepath}")

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            patch_file(os.path.join(root, file))

patch_file('src/layouts/Sidebar.tsx')
patch_file('src/components/workflow/WorkflowContainer.tsx')
