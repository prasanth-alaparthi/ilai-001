import urllib.request
import urllib.error
import json
import random
import string

BASE_URL_AUTH = "http://localhost:8081/api/auth"
BASE_URL_NOTES = "http://localhost:8082/api"
BASE_URL_NOTEBOOKS = "http://localhost:8082/api/notebooks"

def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def log(message, status="INFO"):
    print(f"[{status}] {message}")

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data is not None:
        json_data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        json_data = None

    req = urllib.request.Request(url, data=json_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            resp_body = response.read().decode('utf-8')
            try:
                return response.status, json.loads(resp_body)
            except:
                return response.status, resp_body
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(resp_body)
        except:
            return e.code, resp_body
    except Exception as e:
        return 0, str(e)

def run_audit():
    username = f"testuser_{generate_random_string()}"
    password = "Password123!"
    email = f"{username}@example.com"

    log(f"Starting Backend Audit with User: {username}")

    # 1. Register
    reg_payload = {
        "username": username,
        "password": password,
        "email": email,
        "role": "STUDENT"
    }
    status, body = make_request(f"{BASE_URL_AUTH}/register", "POST", reg_payload)
    if status == 201:
        log("Registration Successful", "PASS")
    else:
        log(f"Registration Failed: {status} - {body}", "FAIL")
        return

    # 2. Login
    login_payload = {"username": username, "password": password}
    status, body = make_request(f"{BASE_URL_AUTH}/login", "POST", login_payload)
    token = None
    if status == 200:
        token = body.get("accessToken")
        log("Login Successful", "PASS")
    else:
        log(f"Login Failed: {status} - {body}", "FAIL")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Notebook
    nb_payload = {"title": "Audit Notebook", "color": "#FF0000"}
    status, body = make_request(BASE_URL_NOTEBOOKS, "POST", nb_payload, headers)
    notebook_id = None
    if status == 200:
        notebook_id = body.get("id")
        log(f"Create Notebook Successful (ID: {notebook_id})", "PASS")
    else:
        log(f"Create Notebook Failed: {status} - {body}", "FAIL")
        return

    # 4. Create Section
    sec_payload = {"title": "Audit Section"}
    status, body = make_request(f"{BASE_URL_NOTEBOOKS}/{notebook_id}/sections", "POST", sec_payload, headers)
    section_id = None
    if status == 200:
        section_id = body.get("id")
        log(f"Create Section Successful (ID: {section_id})", "PASS")
    else:
        log(f"Create Section Failed: {status} - {body}", "FAIL")
        return

    # 5. Create Note
    note_payload = {
        "title": "Audit Note",
        "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hello World"}]}]}
    }
    status, body = make_request(f"{BASE_URL_NOTES}/sections/{section_id}/notes", "POST", note_payload, headers)
    note_id = None
    if status == 200:
        note_id = body.get("id")
        log(f"Create Note Successful (ID: {note_id})", "PASS")
    else:
        log(f"Create Note Failed: {status} - {body}", "FAIL")
        return

    # 6. Read Note
    status, body = make_request(f"{BASE_URL_NOTES}/notes/{note_id}", "GET", None, headers)
    if status == 200 and body.get("title") == "Audit Note":
        log("Read Note Successful", "PASS")
    else:
        log(f"Read Note Failed: {status} - {body}", "FAIL")
        return

    # 7. Update Note
    update_payload = {
        "title": "Audit Note Updated",
        "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hello Updated World"}]}]}
    }
    status, body = make_request(f"{BASE_URL_NOTES}/notes/{note_id}", "PUT", update_payload, headers)
    if status == 200 and body.get("title") == "Audit Note Updated":
        log("Update Note Successful", "PASS")
    else:
        log(f"Update Note Failed: {status} - {body}", "FAIL")
        return

    # 8. Delete Note
    status, body = make_request(f"{BASE_URL_NOTES}/notes/{note_id}", "DELETE", None, headers)
    if status == 204:
        log("Delete Note Successful", "PASS")
    else:
        log(f"Delete Note Failed: {status} - {body}", "FAIL")
        return

    # 9. Verify Deletion
    status, body = make_request(f"{BASE_URL_NOTES}/notes/{note_id}", "GET", None, headers)
    if status == 404:
        log("Verify Deletion Successful", "PASS")
    else:
        log(f"Verify Deletion Failed: Status {status} (Expected 404)", "FAIL")
        return

    print("\n---------------------------------------------------")
    print(f"AUDIT COMPLETE. Credentials for Frontend Test:")
    print(f"Username: {username}")
    print(f"Password: {password}")
    print("---------------------------------------------------")

if __name__ == "__main__":
    run_audit()
