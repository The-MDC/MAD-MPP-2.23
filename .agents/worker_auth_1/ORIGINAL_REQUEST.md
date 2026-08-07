## 2026-07-01T15:11:57Z

You are the Wallet Auth & Database Implementer (teamwork_preview_worker).
Your working directory is: C:\Users\Aaron\.gemini\antigravity\scratch\madgambit\.agents\worker_auth_1
The user's project workspace directory is: C:\Users\Aaron\.gemini\antigravity\scratch\madgambit

Your task is to implement the Wallet Auth Verification (SIWE) and database integration for MAD Gambit.

Requirements:
1. Create a database connection layer in `ai-backend/app/core/database.py` using SQLAlchemy. Expose `get_db` dependency to yield database sessions.
2. Define a SQLAlchemy User model matching the `users` table schema in `migrations/001_initial_schema.sql`.
3. Update `ai-backend/app/routes/auth.py` to:
   - Query the `users` table by `wallet_address` when verifying signature.
   - If user does not exist, insert a new user with that `wallet_address`.
   - Issue a JWT token with the user's UUID in the `sub` claim.
4. Implement a protected endpoint `POST /api/v1/auth/test-write` in `ai-backend/app/routes/auth.py` that:
   - Decodes the JWT token to verify user identity.
   - Updates the user's `xp` field in the database by adding 1.
   - Returns the updated user data.
   - Rejects unauthorized or invalid JWT tokens with a 401 status.
5. Create a programmatic python test script `ai-backend/tests/test_siwe_auth.py` that:
   - Connects to the local FastAPI backend.
   - Simulates wallet authentication using eth-account and siwe:
     - Gets a nonce.
     - Signs a SIWE message.
     - Verifies it against the backend.
   - Verifies that a valid SIWE signature grants access and successfully performs a database write to the Postgres database.
   - Verifies that an invalid wallet signature or token is rejected by the backend when attempting to write to the Postgres database.
6. Verify your implementation by running the backend and the test script, and confirm it runs successfully.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please write a handoff report in C:\Users\Aaron\.gemini\antigravity\scratch\madgambit\.agents\worker_auth_1\handoff.md when you are finished. Ensure all verification results and commands are documented.
