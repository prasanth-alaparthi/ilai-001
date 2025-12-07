import urllib.request
import urllib.error
import json

API_KEY = "AIzaSyAKyCdKczfLIj_FPnNEfuX50pnwf4yzxTA"
URL = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

try:
    req = urllib.request.Request(URL)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        for model in data.get('models', []):
            if 'flash' in model['name']:
                print(model['name'])
except urllib.error.HTTPError as e:
    print(f"Error: {e.code} - {e.read().decode('utf-8')}")
