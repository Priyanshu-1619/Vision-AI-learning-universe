"""
Verification script for Single-Service Render deployment architecture.
Tests production FastAPI server serving both API endpoints and React SPA dist bundle.
"""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

def run_checks():
    port = 8765
    env = os.environ.copy()
    env["PORT"] = str(port)
    env["PYTHONPATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    python_exe = sys.executable
    server_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "start.py"))

    print(f"Launching production single-service server on port {port}...")
    proc = subprocess.Popen(
        [python_exe, server_script],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    base_url = f"http://127.0.0.1:{port}"
    passed = 0
    total = 0

    try:
        # Give server up to 8 seconds to initialize
        ready = False
        for attempt in range(16):
            time.sleep(0.5)
            try:
                with urllib.request.urlopen(f"{base_url}/api/health", timeout=2) as resp:
                    if resp.status == 200:
                        ready = True
                        break
            except Exception:
                pass

        if not ready:
            print("ERROR: Server failed to start within timeout.")
            out, err = proc.communicate(timeout=3)
            print("Server stdout:\n", out)
            print("Server stderr:\n", err)
            sys.exit(1)

        print("[OK] Server started and healthy!")

        def test_get(url_path, check_text=None, is_json=False):
            nonlocal passed, total
            total += 1
            full_url = f"{base_url}{url_path}"
            try:
                req = urllib.request.Request(full_url)
                with urllib.request.urlopen(req, timeout=5) as res:
                    status = res.status
                    content_type = res.headers.get("Content-Type", "")
                    data = res.read().decode("utf-8")

                    if is_json:
                        parsed = json.loads(data)
                        print(f"  PASS: GET {url_path} -> HTTP {status} (JSON valid)")
                    else:
                        assert "<div id=\"root\">" in data or "<html" in data
                        print(f"  PASS: GET {url_path} -> HTTP {status} (SPA HTML bundle served)")
                    passed += 1
            except Exception as e:
                print(f"  FAIL: GET {url_path} -> {e}")

        # 1. Root index & Landing Page
        test_get("/", check_text="<div id=\"root\">")
        test_get("/landing", check_text="<div id=\"root\">")
        test_get("/dashboard", check_text="<div id=\"root\">")

        # 2. SPA Deep Links
        test_get("/data-science", check_text="<div id=\"root\">")
        test_get("/machine-learning", check_text="<div id=\"root\">")
        test_get("/deep-learning", check_text="<div id=\"root\">")
        test_get("/roadmaps/deep-learning", check_text="<div id=\"root\">")
        test_get("/library-graph", check_text="<div id=\"root\">")
        test_get("/concept-universe", check_text="<div id=\"root\">")
        test_get("/laboratory", check_text="<div id=\"root\">")
        test_get("/missions", check_text="<div id=\"root\">")

        # 3. API Endpoints
        test_get("/api/health", is_json=True)
        test_get("/api/concepts", is_json=True)
        test_get("/api/roadmaps", is_json=True)

        # 4. Authentication & Guest Progress Transfer
        total += 1
        test_email = f"learner_{int(time.time())}@space.org"
        auth_token = None
        try:
            reg_payload = json.dumps({
                "email": test_email,
                "password": "secret_space_pass_123",
                "displayName": "Galileo Galilei",
                "guestProgress": {
                    "gradient-descent": {
                        "userId": "learner_default",
                        "topicId": "gradient-descent",
                        "domain": "machine-learning",
                        "status": "completed"
                    }
                },
                "guestMathProgress": {
                    "calculus-derivatives": {
                        "userId": "learner_default",
                        "topicId": "calculus-derivatives",
                        "status": "completed"
                    }
                }
            }).encode("utf-8")
            req = urllib.request.Request(
                f"{base_url}/api/auth/register",
                data=reg_payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5) as res:
                reg_data = json.loads(res.read().decode("utf-8"))
                assert "token" in reg_data
                assert reg_data["user"]["email"] == test_email
                assert reg_data["transferredTopics"] >= 1
                auth_token = reg_data["token"]
                print(f"  PASS: POST /api/auth/register -> user={reg_data['user']['displayName']}, transferred={reg_data['transferredTopics']}")
                passed += 1
        except Exception as e:
            print(f"  FAIL: POST /api/auth/register -> {e}")

        # Login test
        total += 1
        try:
            login_payload = json.dumps({
                "email": test_email,
                "password": "secret_space_pass_123"
            }).encode("utf-8")
            req = urllib.request.Request(
                f"{base_url}/api/auth/login",
                data=login_payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5) as res:
                login_data = json.loads(res.read().decode("utf-8"))
                assert "token" in login_data
                print(f"  PASS: POST /api/auth/login -> successful login for {test_email}")
                passed += 1
        except Exception as e:
            print(f"  FAIL: POST /api/auth/login -> {e}")

        # Current User test (GET /api/auth/me)
        if auth_token:
            total += 1
            try:
                req = urllib.request.Request(
                    f"{base_url}/api/auth/me",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
                with urllib.request.urlopen(req, timeout=5) as res:
                    me_data = json.loads(res.read().decode("utf-8"))
                    assert me_data["email"] == test_email
                    print(f"  PASS: GET /api/auth/me -> verified user {me_data['userId']}")
                    passed += 1
            except Exception as e:
                print(f"  FAIL: GET /api/auth/me -> {e}")

        # 4. Strict 404 for missing API route (must NOT return HTML index.html)
        total += 1
        try:
            urllib.request.urlopen(f"{base_url}/api/this-does-not-exist-at-all", timeout=5)
            print("  FAIL: Expected 404 for unknown API path, got 200")
        except urllib.error.HTTPError as he:
            if he.code == 404:
                body = he.read().decode("utf-8")
                try:
                    j = json.loads(body)
                    print(f"  PASS: Strict API 404 returned JSON -> {j}")
                    passed += 1
                except Exception:
                    print("  FAIL: 404 did not return JSON!")
            else:
                print(f"  FAIL: Unexpected status {he.code}")

        # 5. POST Lab Endpoint: Logistic Regression
        total += 1
        try:
            lab_payload = json.dumps({
                "data": [[0.1, 0.2, 0], [0.2, 0.3, 0], [1.1, 1.2, 1], [1.3, 1.4, 1]],
                "cParam": 1.0,
                "maxIter": 50
            }).encode("utf-8")
            req = urllib.request.Request(
                f"{base_url}/api/labs/logistic-regression",
                data=lab_payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5) as res:
                res_data = json.loads(res.read().decode("utf-8"))
                assert "accuracy" in res_data
                assert "coefficients" in res_data
                print(f"  PASS: POST /api/labs/logistic-regression -> accuracy={res_data['accuracy']}, coef={res_data['coefficients']}")
                passed += 1
        except Exception as e:
            print(f"  FAIL: POST /api/labs/logistic-regression -> {e}")

        # 6. POST Progress Sync & GET Persistence
        total += 1
        try:
            sync_payload = json.dumps({
                "userId": "test_verification_learner",
                "records": {
                    "linear-regression": {
                        "userId": "test_verification_learner",
                        "topicId": "linear-regression",
                        "domain": "machine-learning",
                        "status": "completed",
                        "completedAt": "2026-11-15T12:00:00Z"
                    }
                },
                "mathRecords": {
                    "derivatives": {
                        "userId": "test_verification_learner",
                        "topicId": "derivatives",
                        "status": "completed"
                    }
                }
            }).encode("utf-8")
            req = urllib.request.Request(
                f"{base_url}/api/progress/sync",
                data=sync_payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5) as res:
                sync_res = json.loads(res.read().decode("utf-8"))
                assert sync_res["status"] == "ok"
                assert sync_res["saved_records"] >= 1

            # Verify persisted records read back
            with urllib.request.urlopen(f"{base_url}/api/progress/test_verification_learner", timeout=5) as res:
                prog_data = json.loads(res.read().decode("utf-8"))
                assert "linear-regression" in prog_data["records"]
                assert prog_data["records"]["linear-regression"]["status"] == "completed"
                print(f"  PASS: Progress persistence verified in SQLite! Saved: {sync_res['saved_records']} records")
                passed += 1
        except Exception as e:
            print(f"  FAIL: Progress sync verification -> {e}")

    finally:
        print("Shutting down test server...")
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()

    print(f"\n==========================================")
    print(f"Verification Results: {passed}/{total} Passed")
    print(f"==========================================")
    if passed == total:
        print("ALL SINGLE-SERVICE RENDER ARCHITECTURE CHECKS PASSED!")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_checks()
