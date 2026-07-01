import sys
import os
import time
import requests
import jwt
from eth_account import Account
from eth_account.messages import encode_defunct
from siwe import SiweMessage
from datetime import datetime, timezone

# Force localhost for DB connection if running tests from host
os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "postgresql://madgambit:madgambit@localhost:5432/madgambit").replace("@postgres:", "@localhost:")

# Add parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.user import User

settings = get_settings()
BACKEND_URL = "http://localhost:8001"

def test_siwe_auth_flow():
    print("=== Starting SIWE Auth & DB Integration Test ===")
    
    # 1. Generate a new Ethereum wallet
    account = Account.create()
    wallet_address = account.address
    print(f"Generated test wallet: {wallet_address}")

    # 2. Get nonce from FastAPI backend
    print("Fetching nonce from backend...")
    nonce_url = f"{BACKEND_URL}/api/v1/auth/nonce"
    try:
        response = requests.get(nonce_url, timeout=5)
        response.raise_for_status()
    except Exception as e:
        print(f"ERROR: Failed to connect to backend at {BACKEND_URL}. Is the server running?")
        print(f"Details: {e}")
        sys.exit(1)
        
    nonce_data = response.json()
    nonce = nonce_data.get("nonce")
    print(f"Received nonce: {nonce}")
    assert nonce is not None, "Nonce should not be None"

    # 3. Create and sign SIWE message
    print("Creating and signing SIWE message...")
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    siwe_msg = SiweMessage(message={
        "domain": "localhost",
        "address": wallet_address,
        "statement": "Sign in with Ethereum to MAD Gambit.",
        "uri": f"{BACKEND_URL}",
        "version": "1",
        "chainId": 1,
        "nonce": nonce,
        "issuedAt": now_iso
    })
    
    message_text = siwe_msg.prepare_message()
    signable_message = encode_defunct(text=message_text)
    signed = Account.sign_message(signable_message, private_key=account.key.hex())
    signature = signed.signature.hex()
    if not signature.startswith("0x"):
        signature = "0x" + signature
    print("Message signed successfully.")

    # 4. Verify SIWE signature against the backend
    print("Verifying signature and requesting JWT token...")
    verify_url = f"{BACKEND_URL}/api/v1/auth/verify"
    payload = {
        "message": message_text,
        "signature": signature
    }
    
    verify_response = requests.post(verify_url, json=payload, timeout=5)
    print(f"Verify response status: {verify_response.status_code}")
    assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}"
    
    verify_data = verify_response.json()
    token = verify_data.get("token")
    returned_address = verify_data.get("wallet_address")
    print(f"Received JWT: {token[:20]}...")
    print(f"Returned address: {returned_address}")
    assert token is not None, "JWT token must not be None"
    assert returned_address.lower() == wallet_address.lower(), "Returned wallet address must match"

    # 5. Direct Database Check (Pre-write)
    print("Verifying user entry exists in Postgres database directly...")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.wallet_address == wallet_address.lower()).first()
        assert user is not None, "User was not created in database upon verification"
        print(f"Database record found. User ID: {user.id}, Initial XP: {user.xp}")
        assert user.xp == 0, f"Expected initial XP to be 0, got {user.xp}"
    finally:
        db.close()

    # 6. Test Write (Increment XP with valid token)
    print("Testing /test-write endpoint with valid JWT token...")
    write_url = f"{BACKEND_URL}/api/v1/auth/test-write"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    write_response = requests.post(write_url, headers=headers, timeout=5)
    print(f"Write response status: {write_response.status_code}")
    assert write_response.status_code == 200, f"Expected 200, got {write_response.status_code}"
    
    write_data = write_response.json()
    print(f"Response data: {write_data}")
    assert write_data.get("xp") == 1, f"Expected XP to be 1, got {write_data.get('xp')}"

    # 7. Direct Database Check (Post-write)
    print("Verifying database state has been updated...")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.wallet_address == wallet_address.lower()).first()
        print(f"Database XP after write: {user.xp}")
        assert user.xp == 1, f"Database write failed: XP is {user.xp}, expected 1"
        print("Database verification passed: XP successfully incremented to 1.")
    finally:
        db.close()

    # 8. Verify rejection of invalid signature / verification
    print("Testing /verify rejection with invalid signature...")
    bad_payload = {
        "message": message_text,
        "signature": "0x" + "0" * 130  # dummy invalid signature
    }
    bad_verify_response = requests.post(verify_url, json=bad_payload, timeout=5)
    print(f"Bad verify response status: {bad_verify_response.status_code}")
    assert bad_verify_response.status_code == 400, f"Expected 400, got {bad_verify_response.status_code}"

    # 9. Verify rejection of unauthorized write
    print("Testing /test-write rejection with missing Authorization header...")
    no_auth_response = requests.post(write_url, timeout=5)
    print(f"No auth response status: {no_auth_response.status_code}")
    assert no_auth_response.status_code == 401, f"Expected 401, got {no_auth_response.status_code}"

    # 10. Verify rejection of invalid JWT token
    print("Testing /test-write rejection with invalid JWT token...")
    bad_headers = {
        "Authorization": "Bearer invalid_token_here"
    }
    bad_auth_response = requests.post(write_url, headers=bad_headers, timeout=5)
    print(f"Bad auth response status: {bad_auth_response.status_code}")
    assert bad_auth_response.status_code == 401, f"Expected 401, got {bad_auth_response.status_code}"

    print("=== All SIWE Auth & DB Integration Tests Passed Successfully ===")

if __name__ == "__main__":
    test_siwe_auth_flow()
