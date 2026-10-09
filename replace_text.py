import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # If AppText is already imported, we might skip or fix it
    if 'AppText' in content:
        # Just to be safe, if we already did something
        pass
    else:
        # Check if react-native Text is imported
        if re.search(r'import\s+{[^}]*?\bText\b[^}]*?}\s+from\s+[\'"]react-native[\'"]', content) or '<Text' in content:
            # We need to import AppText
            # Find how many directories up we are from src/components/AppText.tsx
            rel_path = os.path.relpath('apps/colguetti/src/components/AppText.tsx', os.path.dirname(filepath))
            # Remove .tsx
            rel_path = rel_path[:-4]
            if not rel_path.startswith('.'):
                rel_path = './' + rel_path
            
            # Insert import at the top of the file
            import_statement = f"import AppText from '{rel_path}';\n"
            
            # Find the first import statement and put it before
            content = re.sub(r'^(import .*?;?\n)', import_statement + r'\1', content, count=1)
            
            # Replace <Text with <AppText and </Text> with </AppText>
            content = re.sub(r'<Text\b', '<AppText', content)
            content = re.sub(r'</Text>', '</AppText>', content)
            
            # Remove Text from react-native import if it's there
            content = re.sub(r'(import\s+{[^}]*?)\bText\b,?(\s*[^}]*?}\s+from\s+[\'"]react-native[\'"])', 
                             lambda m: (m.group(1) + m.group(2)).replace('{ ,', '{ ').replace(', }', ' }').replace('{  }', ''), 
                             content)

            # Cleanup empty imports like import { } from 'react-native'
            content = re.sub(r'import\s+{\s*}\s+from\s+[\'"]react-native[\'"];?\n', '', content)

            with open(filepath, 'w') as f:
                f.write(content)

for filepath in glob.glob('apps/colguetti/src/**/*.tsx', recursive=True):
    if not filepath.endswith('AppText.tsx'):
        process_file(filepath)
