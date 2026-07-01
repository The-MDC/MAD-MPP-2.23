import sys
import os
from dotenv import load_dotenv
from unittest.mock import AsyncMock

# Add parent directory to sys.path so we can import app modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

# Load env variables from .env
env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    print(f"Loading environment from {env_path}")
    load_dotenv(env_path)
else:
    print(f"No .env file found at {env_path}")

print("GEMMA_ENDPOINT_URL:", os.getenv("GEMMA_ENDPOINT_URL"))

# Set dummy Google API key to bypass initialization check if needed
os.environ["GOOGLE_API_KEY"] = "fake-key-for-testing"

# Mock the langchain_community.chat_models.ChatOllama.ainvoke method before importing app
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import AIMessage

async def mock_ainvoke_side_effect(messages, *args, **kwargs):
    # Determine which endpoint is calling based on the messages content
    system_msg = messages[0].content if messages else ""
    if "Sentinel" in system_msg:
        # Return valid JSON matching BsIndexResult schema
        return AIMessage(content='{"bs_index": 42.0, "verdict": "SUSPECT", "reasoning": "This is totally sus."}')
    else:
        # Return typical satirized headline
        return AIMessage(content="Yo, Jersey style rewritten headline!")

mock_ainvoke = AsyncMock()
mock_ainvoke.side_effect = mock_ainvoke_side_effect
ChatOllama.ainvoke = mock_ainvoke

# Now import the app and TestClient
from fastapi.testclient import TestClient
from app.main import app

def test_gemma_integration():
    print("=== Starting Gemma Integration Test ===")
    client = TestClient(app)

    # 1. Query /health endpoint
    print("Querying /health...")
    response = client.get("/health")
    print(f"Health response status: {response.status_code}")
    print(f"Health response body: {response.json()}")
    assert response.status_code == 200
    data = response.json()
    assert data.get("gemma_configured") is True, f"Expected gemma_configured to be True, got {data.get('gemma_configured')}"

    # 2. Query /api/v1/ai/satirize
    print("Testing /api/v1/ai/satirize...")
    satirize_payload = {"headline": "Breaking News: Local developer finishes task without coffee!"}
    response = client.post("/api/v1/ai/satirize", json=satirize_payload)
    print(f"Satirize response status: {response.status_code}")
    print(f"Satirize response body: {response.json()}")
    assert response.status_code == 200
    data = response.json()
    assert "original" in data
    assert "satirized" in data
    assert data["original"] == satirize_payload["headline"]
    assert data["satirized"] == "Yo, Jersey style rewritten headline!"

    # 3. Query /api/v1/ai/zliar
    print("Testing /api/v1/ai/zliar...")
    zliar_payload = {"statement": "I have 10 years of experience in AI agents."}
    response = client.post("/api/v1/ai/zliar", json=zliar_payload)
    print(f"Zliar response status: {response.status_code}")
    print(f"Zliar response body: {response.json()}")
    assert response.status_code == 200
    data = response.json()
    assert "bs_index" in data
    assert "verdict" in data
    assert "reasoning" in data
    assert data["bs_index"] == 42.0
    assert data["verdict"] == "SUSPECT"
    assert data["reasoning"] == "This is totally sus."

    print("=== All Gemma Integration Tests Passed Successfully ===")

if __name__ == "__main__":
    test_gemma_integration()
