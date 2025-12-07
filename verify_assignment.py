import urllib.request
import urllib.error
import json
import time
import hmac
import hashlib
import base64

ASSIGNMENT_URL = "http://localhost:8089/api/assignments"
JWT_SECRET = "1a3b5c7d9e2f4g6h8j0k2l4n6p8q0s2u4w6y8z0x2v4t6r8m0k2i4g6e8c0a"

def base64url_encode(input_bytes):
    return base64.urlsafe_b64encode(input_bytes).decode('utf-8').replace('=', '')

def generate_jwt(email):
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
        "roles": ["TEACHER"]
    }
    
    encoded_header = base64url_encode(json.dumps(header).encode('utf-8'))
    encoded_payload = base64url_encode(json.dumps(payload).encode('utf-8'))
    
    signature_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    signature = hmac.new(JWT_SECRET.encode('utf-8'), signature_input, hashlib.sha256).digest()
    encoded_signature = base64url_encode(signature)
    
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def post(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error calling {url}: {e.code} - {e.read().decode('utf-8')}")
        raise

def run_test():
    try:
        email = "teacher@muse.com"
        token = generate_jwt(email)
        print(f"Generated JWT for {email}")

        print("Creating assignment...")
        assignment = post(ASSIGNMENT_URL, {
            "title": "History of AI",
            "description": "Write a short paragraph about the history of AI.",
            "criteria": "Mention Turing Test and Deep Learning. Be concise.",
            "maxScore": 10,
            "courseId": 101,
            "teacherId": email
        }, token)
        print(f"Assignment created: {assignment['id']}")

        print("Submitting assignment...")
        submission = post(f"{ASSIGNMENT_URL}/submit", {
            "assignmentId": assignment['id'],
            "studentId": "student_1",
            "content": "AI started with the Turing Test in 1950. Then came expert systems. Now we have Deep Learning which powers ChatGPT."
        }, token)
        print(f"Submission created: {submission['id']}")

        print("Grading submission (AI)...")
        grade = post(f"{ASSIGNMENT_URL}/grade/{submission['id']}", {}, token)
        print(f"Grade received: Score={grade['score']}, Feedback={grade['feedback']}")
        
        if grade['score'] > 0:
            print("VERIFICATION SUCCESSFUL!")
        else:
            print("VERIFICATION FAILED: Score is 0")

    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    run_test()
