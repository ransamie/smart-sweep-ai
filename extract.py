import json
import os

def extract_code(cid):
    path = f'C:/Users/Ransom/.gemini/antigravity/brain/{cid}/.system_generated/logs/transcript_full.jsonl'
    if not os.path.exists(path): 
        print(f"Path not found: {path}")
        return
    
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
            except:
                continue
            if data.get('type') == 'PLANNER_RESPONSE' and 'tool_calls' in data:
                for call in data['tool_calls']:
                    if call['name'] == 'send_message' and 'Message' in call['args']:
                        msg = call['args']['Message']
                        print(f'Found message in {cid}, length: {len(msg)}')
                        out_path = f'C:/Users/Ransom/.gemini/antigravity/brain/700f9b81-bc17-4c64-a1b9-cf8127b0a65e/scratch_{cid}.txt'
                        with open(out_path, 'w', encoding='utf-8') as out:
                            out.write(msg)

extract_code('8064fcee-b044-4be8-a4cd-7c9d76323692')
extract_code('6d83fcc2-c7ce-4d16-b9bb-f118756f95b6')
extract_code('02a0aa9b-2125-4be7-84f0-d3e576d59461')
