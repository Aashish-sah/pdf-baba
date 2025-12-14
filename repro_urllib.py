import urllib.request
import urllib.parse
import json
import os

url = 'http://localhost:4000/api/tools/merge'
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'

def encode_multipart_formdata(fields, files):
    body = []
    for key, value in fields.items():
        body.append(f'--{boundary}'.encode())
        body.append(f'Content-Disposition: form-data; name="{key}"'.encode())
        body.append(b'')
        body.append(value.encode())
    
    for key, (filename, content) in files:
        body.append(f'--{boundary}'.encode())
        body.append(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"'.encode())
        body.append(b'Content-Type: application/pdf')
        body.append(b'')
        body.append(content)
    
    body.append(f'--{boundary}--'.encode())
    body.append(b'')
    return b'\r\n'.join(body)

# Read file
# We assume script is run in e:\pdf-baba
with open('e:/pdf-baba/test.pdf', 'rb') as f:
    pdf_content = f.read()



fields = {
    'order': json.dumps([0, 1]),
    'properties': json.dumps({})
}
files = [
    ('files', ('test1.pdf', pdf_content)),
    ('files', ('test2.pdf', pdf_content))
]

data = encode_multipart_formdata(fields, files)

req = urllib.request.Request(url, data=data)
req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"Error: {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"Failed: {e}")
