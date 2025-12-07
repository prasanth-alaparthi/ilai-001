import urllib.request
import urllib.parse
import json
import ssl

def run_verification():
    base_url = "http://localhost:8081/api/auth"
    notes_url = "http://localhost:8082/api/notes/ask"
    
    # 1. Login
    print("Logging in...")
    login_data = json.dumps({
        "username": "testuser_gfhwu7ua",
        "password": "Password123!"
    }).encode('utf-8')
    
    req = urllib.request.Request(f"{base_url}/login", data=login_data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                token = data['accessToken']
                print("Login successful. Token obtained.")
            else:
                print(f"Login failed: {response.status}")
                return
    except Exception as e:
        print(f"Login error: {e}")
        return

    # 2. Ask Ilai
    print("Asking Ilai Tutor...")
    ask_data = json.dumps({
        "question": "What is in my notes?"
    }).encode('utf-8')
    
    req = urllib.request.Request(notes_url, data=ask_data, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    })
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                print("Ilai Tutor Response:")
                print(json.dumps(data, indent=2))
                print("VERIFICATION PASSED")
            else:
                print(f"Ilai Tutor failed: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"Ilai Tutor HTTP Error: {e.code}")
        print(e.read().decode())
    except Exception as e:
        print(f"Ilai Tutor Error: {e}")

if __name__ == "__main__":
    run_verification()
