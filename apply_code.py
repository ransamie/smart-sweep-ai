import os
import re

def parse_blocks(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    blocks = []
    
    # regex for file path header
    pattern = re.compile(r'(`[^`]+`|\*\*[^*]+\*\*|###\s*.*`[^`]+`)[\s\S]*?```[a-z]*\n([\s\S]*?)```')
    matches = pattern.finditer(content)
    for m in matches:
        header = m.group(1)
        code = m.group(2)
        
        # Extract filename
        fname_match = re.search(r'`([^`]+)`', header)
        if fname_match:
            filename = fname_match.group(1)
            # basic validation
            if len(filename) < 50 and ('/' in filename or '\\' in filename):
                blocks.append((filename, code))
                print(f"Extracted {filename}")
    return blocks

all_blocks = []
all_blocks.extend(parse_blocks('C:/Users/Ransom/.gemini/antigravity/brain/700f9b81-bc17-4c64-a1b9-cf8127b0a65e/scratch_02a0aa9b-2125-4be7-84f0-d3e576d59461.txt'))

for fname, code in all_blocks:
    if fname.startswith('electron/main.ts'):
        pass # Handle manually
    elif fname.startswith('electron/ai.ts'):
        with open('electron/ai.ts', 'a', encoding='utf-8') as f:
            f.write('\n' + code)
        print(f"Appended {fname}")
    else:
        os.makedirs(os.path.dirname(fname) or '.', exist_ok=True)
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"Wrote {fname}")
