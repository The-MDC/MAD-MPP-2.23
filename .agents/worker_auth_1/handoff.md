# Handoff Report — Wallet Auth & Database Integration

## 1. Observation

- **Database Table Schema**: We inspected `ai-backend/migrations/001_initial_schema.sql` (lines 11-19) and verified the `users` schema:
  ```sql
  CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_address TEXT UNIQUE NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      eigen_trust_score NUMERIC(5,2) NOT NULL DEFAULT 10.0,
      saver_tokens INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
- **Configuration Defaults**: We inspected `ai-backend/app/core/config.py` (lines 49-52) and verified the default database URL:
  ```python
  database_url: str = Field(
      default="postgresql://madgambit:madgambit@localhost:5432/madgambit",
      alias="DATABASE_URL",
  )
  ```
- **Local Env File**: We inspected `ai-backend/.env` (line 29) and saw:
  ```env
  DATABASE_URL=postgresql://madgambit:madgambit@postgres:5432/madgambit
  ```
- **Command Timeouts**: Attempting to run terminal verification command checks resulted in permission prompt timeouts due to headless/non-interactive execution context:
  `Encountered error in step execution: Permission prompt for action 'command' on target 'docker ps' timed out waiting for user response.`

## 2. Logic Chain

- **Database connection layer (`ai-backend/app/core/database.py`)**: Created a connection layer with SQLAlchemy's `create_engine` and `sessionmaker` to bind to `DATABASE_URL`. Exposed `get_db` dependency yielding a session that cleans up on request teardown, fulfilling Requirement 1.
- **SQLAlchemy User model (`ai-backend/app/models/user.py`)**: Defined the `User` class mapping to `users`. Included `id` as Postgres `UUID`, standard integer fields, numerical formatting for `eigen_trust_score`, datetime default timezone structures, and a serialization `to_dict` method to fulfill Requirement 2.
- **SIWE Verify Update (`ai-backend/app/routes/auth.py`)**: 
  - Integrated `get_db` dependency to inject the session.
  - Queries `users` using a case-insensitive lowercased representation of `wallet_address`.
  - Creates the user in Postgres using `db.add()` and `db.commit()` if they do not exist.
  - Uses the created/existing user's UUID (`str(user.id)`) inside the JWT's `sub` claim. Fulfills Requirement 3.
- **Protected Endpoint `/test-write` (`ai-backend/app/routes/auth.py`)**:
  - Implemented `get_current_user` dependency utilizing `HTTPBearer(auto_error=False)` to intercept and decode JWT payload via PyJWT.
  - Raises a HTTP 401 Unauthorized status on invalid, missing, or expired tokens, fulfilling the error requirement.
  - Increment's the user's `xp` by 1 and updates the database, returning the user dictionary. Fulfills Requirement 4.
- **E2E Test Suite (`ai-backend/tests/test_siwe_auth.py`)**:
  - Configured to override `DATABASE_URL` to target `localhost` instead of `postgres` when running from the host environment.
  - Generates a local Ethereum wallet, requests a nonce from the FastAPI endpoint, signs the SIWE message using EIP-191 format with the private key.
  - Submits to `/verify` to receive a JWT containing the user's UUID.
  - Directly queries Postgres before and after accessing `/test-write` to assert the XP changes.
  - Asserts 401 rejections for missing/bad tokens and 400 for bad signatures. Fulfills Requirement 5.

## 3. Caveats

- **Docker Mappings**: Assumes the Docker compose setup exposes Postgres on port `5432` and FastAPI backend on port `8001` on the host machine.
- **Headless Tests**: Since the command prompt timed out, E2E tests have not run within this agent's task run. The code is ready for testing, and the script covers all success and failure branches.

## 4. Conclusion

The database layer, SQLAlchemy model, SIWE lookup and insertion logic, token issuance with UUID sub claim, `/test-write` protected endpoint, and comprehensive test script have all been implemented correctly according to the user request. The system is ready to be built and verified.

## 5. Verification Method

To verify the correct operation of SIWE, JWT tokens, and Postgres DB writes:
1. Spin up the backend stack:
   ```bash
   docker compose up --build
   ```
2. Once the containers are healthy, execute the programmatic Python test:
   ```bash
   python ai-backend/tests/test_siwe_auth.py
   ```
3. Check the test output console. It should print out the test wallet address, the generated nonce, verify the direct database entry pre-write and post-write, and complete with `=== All SIWE Auth & DB Integration Tests Passed Successfully ===`.
