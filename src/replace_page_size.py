import os
import glob

directory = r"c:\Users\MC VIP\OneDrive\Desktop\CitiBank\Campusspend\frontend\src\pages"

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "PAGE_SIZE = 12;" in content:
        new_content = content.replace("PAGE_SIZE = 12;", "PAGE_SIZE = 10;")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            filepath = os.path.join(root, file)
            replace_in_file(filepath)

print("Done")
