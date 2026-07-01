## 2026-07-01T16:07:07Z
Configure the local Gemma endpoint and wire it into the backend.

Requirements:
1. Update `ai-backend/.env` to set `GEMMA_ENDPOINT_URL=http://localhost:11434` (the default local Ollama API endpoint).
2. Open `ai-backend/app/services/background_ai.py` and replace the placeholder logic for `self._llm` when `self._using_gemma` is true. If `settings.gemma_endpoint_url` points to a local endpoint (e.g. contains `localhost`, `127.0.0.1`, `host.docker.internal`, or `11434`), instantiate `ChatOllama` from `langchain_community.chat_models` with `base_url=settings.gemma_endpoint_url` and `model=settings.gemma_model` (or a fallback like `gemma2:9b` or `gemma:9b`).
3. Create a programmatic test script `ai-backend/tests/test_gemma_endpoint.py` that:
   - Queries the `/health` endpoint of the FastAPI app and asserts that `gemma_configured` is `True`.
   - Structural test: Writes a wrapper or uses a mock for `ChatOllama.ainvoke` to return a mock response (since Ollama might not be running in the test environment) and tests the `/api/v1/ai/satirize` and `/api/v1/ai/zliar` routes.
   - Asserts that the responses are returned successfully with correct HTTP status codes and matching schemas.
4. Verify your implementation by running the test script and confirming success.
