# Adversarial Challenge Report — AI Concierge Wiring

## Challenge Summary

**Overall risk assessment**: MEDIUM

While the basic wiring of the AI Concierge is structurally sound and follows the design specifications, several implicit assumptions and design choices introduce operational risks.

---

## Challenges

### [Medium] Challenge 1: Absence of Graceful Fallback for LLM Failures

- **Assumption challenged**: The Google Gemini API is always reachable, credentialed, and within quota.
- **Attack scenario**: Outgoing API requests to Google AI Studio fail due to network partitions, expired API keys, or quota exhaustion (e.g., HTTP 429 / 401 / 503).
- **Blast radius**: The router's catch-all `except Exception` blocks in `ai.py` will catch the error, log it, and return an HTTP 502:
  ```json
  {"detail": "MADHAT'r is temporarily offline. Try again in a moment."}
  ```
  This renders the concierge entirely unusable for the user.
- **Mitigation**: Implement a local fallback reply generator (using the static offline reply banks from the frontend design) in the backend service when the Gemini API is offline.

### [Medium] Challenge 2: In-Memory Rate Limiting in Multi-Instance Environments

- **Assumption challenged**: The backend application will run as a single instance.
- **Attack scenario**: The app is deployed to an autoscaling container service (e.g., Google Cloud Run) with multiple active container instances.
- **Blast radius**: The rate limiter uses an in-memory dictionary (`_request_log` in `app/main.py`). Requests from a single client will be distributed across instances, allowing them to exceed the configured rate limits (e.g., `RATE_LIMIT_PER_MINUTE=30`) and potentially exhausting LLM API budgets.
- **Mitigation**: Migrate the rate-limiting state to a shared database or key-value store (e.g., Redis / Cloud Memorystore).

### [Low] Challenge 3: Regen Count Escalation & Safety Filtering

- **Assumption challenged**: Escalating model intensity via `regen_count` will not trigger content safety filters.
- **Attack scenario**: A user regenerates a satirical/controversial response multiple times (`regen_count > 5`), causing the prompt to instruct:
  `"Escalate your intensity. Be sharper, funnier, more unhinged than your first take."`
- **Blast radius**: The LLM output may cross safety guidelines or trigger Google Gemini's built-in safety filters, resulting in blocked responses or empty returns, leading to errors.
- **Mitigation**: Clamp `regen_count` to a maximum value (e.g., 3) and ensure safety settings are explicitly configured on the `ChatGoogleGenerativeAI` instance.

---

## Stress Test Results

### Scenario A: Google API Key Missing or Invalid
- **Expected behavior**: Application fails gracefully or provides useful mock replies.
- **Actual behavior**: FastAPI endpoint returns HTTP 502.
- **Result**: FAIL (Vulnerability confirmed).

### Scenario B: Multi-turn Chat Context Window Limit
- **Expected behavior**: Context does not grow indefinitely.
- **Actual behavior**: Service trims history to `history[-10:]`.
- **Result**: PASS (Robust limit).
