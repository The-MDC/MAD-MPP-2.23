import sys
import os
from unittest.mock import AsyncMock

# Add current and parent directories to sys.path so we can import app and tests
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

# Set dummy API key to bypass initialization check
os.environ["GOOGLE_API_KEY"] = "fake-key-for-testing"

# Import LangChain classes to mock them
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AIMessage

# Mock the ainvoke method of ChatGoogleGenerativeAI
mock_ainvoke = AsyncMock(return_value=AIMessage(content="Ayo, Jersey style reply here!"))
ChatGoogleGenerativeAI.ainvoke = mock_ainvoke

# Import the test script
from tests.test_concierge_wiring import run_concierge_test

if __name__ == "__main__":
    print("Running concierge wiring integration test with mock LLM...")
    run_concierge_test()
    print("Mock ainvoke call count:", mock_ainvoke.call_count)
