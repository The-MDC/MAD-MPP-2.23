# Google Generative Language API (`gen-lang-client`) — Comprehensive API Reference
For developers extending **The MΛD Gambit** or implementing programmatic sentiment consensus agents.

This document serves as the absolute technical specification of the Google Generative Language API (also colloquially referred to inside our systems as `gen-lang-client`). It details all endpoints, schemas, headers, query structures, authentication methods, and robust error handling for programmatic consumption.

---

## 1. Gateway & Architectural Overview

The `gen-lang-client` architecture interfaces directly with Google's Generative Language REST gateway. It bridges local Kotlin state-flow mechanics with massive remote deep learning and serverless models.

* **Base URL:** `https://generativelanguage.googleapis.com/`
* **Protocol:** HTTP/1.1 or HTTP/2 over TLS 1.3
* **Content-Type:** `application/json`

---

## 2. Authentication Methods

The primary authentication vector utilized by our local `RetrofitClient` is the **API Key Query Parameter**.

### Query Parameter Key Injection
```http
POST /v1beta/models/gemini-3.5-flash:generateContent?key=YOUR_API_KEY_HERE HTTP/1.1
Host: generativelanguage.googleapis.com
Content-Type: application/json
```
* **Header Requirement:** No authorization header is required when utilizing the query parameter vector.
* **Security Guardrail:** The API key MUST be kept out of direct source repository files. It is bound securely at build-time using the `Secrets Gradle Plugin` (mapping the localized `.env` configuration file into the code via generated `BuildConfig`).

---

## 3. Core API Endpoints

### Endpoint A: content Generation (`gemini-3.5-flash`)
The workhorse model for high-frequency, low-latency, highly stylized text generation (such as satire tickers, chat responses, and forum summary narratives).

* **Method:** `POST`
* **Path:** `/v1beta/models/gemini-3.5-flash:generateContent`
* **Query Parameters:**
  * `key` (String, required): Your generated developer console API credential.
  
#### Request Headers
```http
Content-Type: application/json
```

#### Complete JSON Request Payload Schema
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Analyze the consensus of Kalshi's prediction bounds for today's market crash."
        }
      ]
    }
  ],
  "systemInstruction": {
    "role": "system",
    "parts": [
      {
        "text": "You are the MAD Gambit Concierge and Host, known as 'The MADHATr'. You have a distinct Jersey accent and a husky voice. Speak colloquially."
      }
    ]
  },
  "generationConfig": {
    "temperature": 0.85,
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 1024
  }
}
```

#### JSON Request Key Descriptions:
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `contents` | Array | Yes | Ordered collection representing multi-turn message exchanges. |
| `contents[].role` | String | No | Role identifier. Valid values: `"user"`, `"model"`. |
| `contents[].parts` | Array | Yes | Structured atomic parts. |
| `contents[].parts[].text`| String | Yes | Content payload. |
| `systemInstruction` | Object | No | Hardcoded instruction constraining AI persona or behavior. |
| `generationConfig` | Object | No | Hyperparameters adjusting randomness and output width. |

#### Complete JSON Response Payload Schema
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Ah, look at them Kalshi copycats running around like headless chickens, y'know? Their metrics are flatter than a double-parked Buick on Newark Avenue. Fuggedaboutit! Staking is up 45% in our pools."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0,
      "safetyRatings": [
        {
          "category": "HARM_CATEGORY_HARASSMENT",
          "probability": "NEGLIGIBLE"
        },
        {
          "category": "HARM_CATEGORY_HATE_SPEECH",
          "probability": "NEGLIGIBLE"
        }
      ]
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 112,
    "candidatesTokenCount": 54,
    "totalTokenCount": 166
  }
}
```

---

### Endpoint B: Cognitive Deep Auditing (`gemini-1.5-pro`)
Utilized for large-context, compute-heavy tasks such as full transaction list Sybil audit, fraud consensus diagnostics, and multi-feed sentiment classification.

* **Method:** `POST`
* **Path:** `/v1beta/models/gemini-1.5-pro:generateContent`
* **Query Parameters:**
  * `key` (String, required): API access key.

#### Complete JSON Request Payload Schema
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Perform dynamic analysis on user wager interval: [1.2s, 1.1s, 1.2s, 1.3s]. Evaluate probability of botting."
        }
      ]
    }
  ]
}
```

#### Complete JSON Response Payload Schema
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "SYBIL ANALYSIS LOG: Automated repetitive interval frequency identified. The 1.2s standard deviation remains under 0.05. High probability (>97.5%) of scripted macro execution."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ]
}
```

---

## 4. Platform Client Integration Blueprint (Kotlin)

Inside **The MΛD Gambit**, communication with these endpoints is abstracted into type-safe Kotlin serializable data transfer objects (DTOs) and retrofitted interface methods:

```kotlin
@Serializable
data class GenerateContentRequest(
    val contents: List<Content>,
    val systemInstruction: Content? = null,
    val tools: List<Tool>? = null
)

interface GeminiApiService {
    @POST("v1beta/models/gemini-3.5-flash:generateContent")
    suspend fun generateContent(
        @Query("key") apiKey: String,
        @Body request: GenerateContentRequest
    ): GenerateContentResponse
}
```

---

## 5. Gateway Error & Exception Map

Programmatic consumers of the `gen-lang-client` protocol must capture and handle these specific HTTP status responses gracefully:

| HTTP Code | Error Type | Root Cause Analysis | Remediation Pipeline |
| :--- | :--- | :--- | :--- |
| **400** | `INVALID_ARGUMENT` | Payload schema structurally deformed or invalid model ID. | Validate JSON schema keys against target parameter definitions. |
| **401** | `UNAUTHORIZED` | API key query parameter missing or terminated. | Verify `BuildConfig.GEMINI_API_KEY` exists and has been propagated to the JVM. |
| **403** | `PERMISSION_DENIED` | API key restricted, or network domain throttled. | Check Google Developer Console to ensure the Generative Language API is enabled. |
| **429** | `RESOURCE_EXHAUSTED` | User exceeded active RPM limiters. | Intercept on client and execute exponential back-off using Coroutine dispatchers. |
| **500** | `INTERNAL` | Google cloud server experience brief gateway glitch. | Retry connection with localized jitter. |
