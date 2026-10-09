import os
import glob
import re

for filepath in glob.glob('apps/colguetti/src/**/*.tsx', recursive=True):
    if filepath.endswith('AppText.tsx'): continue
    with open(filepath, 'r') as f:
        content = f.read()

    changed = False
    
    # Replace <Text to <AppText
    if '<Text' in content or '</Text>' in content:
        content = re.sub(r'<Text\b', '<AppText', content)
        content = re.sub(r'</Text>', '</AppText>', content)
        changed = True

    if changed or 'AppText' in content:
        # Check if AppText is imported
        if 'import AppText' not in content:
            rel_path = os.path.relpath('apps/colguetti/src/components/AppText.tsx', os.path.dirname(filepath))
            rel_path = rel_path[:-4]
            if not rel_path.startswith('.'):
                rel_path = './' + rel_path
            
            import_statement = f"import AppText from '{rel_path}';\n"
            content = re.sub(r'^(import .*?;?\n)', import_statement + r'\1', content, count=1)
            changed = True
            
        # Remove Text from react-native imports safely
        # E.g., import { View, Text, StyleSheet } from 'react-native';
        def remove_text_import(m):
            imports = m.group(1).split(',')
            new_imports = [i for i in imports if i.strip() != 'Text']
            if new_imports:
                return "import {" + ",".join(new_imports) + "} from 'react-native'"
            else:
                return ""
                
        content = re.sub(r'import\s+{([^}]*?)}\s+from\s+[\'"]react-native[\'"]', remove_text_import, content)
        changed = True

    if changed:
        with open(filepath, 'w') as f:
            f.write(content)

