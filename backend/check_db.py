import urllib.request, json, sys

BASE = "http://127.0.0.1:8002/api"
PASS = True

def test(name, url, expected_type=list):
    global PASS
    try:
        with urllib.request.urlopen(url) as r:
            data = json.loads(r.read())
            ok = isinstance(data, expected_type)
            print(f"  {'✓' if ok else '✗'} {name}: {len(data) if isinstance(data, list) else data}")
            if not ok:
                PASS = False
    except Exception as e:
        print(f"  ✗ {name}: ERROR - {e}")
        PASS = False

print("\n=== API Endpoint Tests ===")
test("GET /subjects/", f"{BASE}/subjects/")
test("GET /files/",    f"{BASE}/files/")
test("GET /prs/pending", f"{BASE}/prs/pending")
test("GET /auth/users",  f"{BASE}/auth/users")
test("GET /dashboard/stats", f"{BASE}/dashboard/stats", dict)

# Test login
print("\n  Testing POST /auth/login...")
try:
    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=json.dumps({"email": "teacher@studify.com", "password": "teacher123"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
        print(f"  ✓ Login OK: {data.get('email')} role={data.get('role')}")
except Exception as e:
    print(f"  ✗ Login ERROR: {e}")
    PASS = False

print(f"\n=== {'ALL TESTS PASSED' if PASS else 'SOME TESTS FAILED'} ===")
sys.exit(0 if PASS else 1)
