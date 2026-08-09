---
name: vercel-ai-gateway-anthropic
description: Call Claude through Vercel AI Gateway's Anthropic-compatible Messages API — the ai-gateway.vercel.sh base URL, AI_GATEWAY_API_KEY vs VERCEL_OIDC_TOKEN auth, provider-prefixed model IDs, and the advanced surface: streaming, extended thinking, tool use and server-side web search, structured outputs, prompt caching, fast mode and service tiers. Use when routing Anthropic SDK traffic through the gateway, swapping providers behind one endpoint, adding web search or JSON-schema output to a Claude call, or reading gateway routing metadata. Triggers on "AI Gateway", "ai-gateway.vercel.sh", "AI_GATEWAY_API_KEY", "Anthropic Messages API", "anthropic/claude-opus-5", "provider_metadata", "fast mode", "service tier", "VERCEL_OIDC_TOKEN".
---

# Vercel AI Gateway — Anthropic Messages API

Point the official Anthropic SDK at Vercel's gateway and keep your existing code.

**Scope.** The `ai-sdk` skill covers the Vercel AI SDK (`generateText`,
`streamText`). This skill covers the **Anthropic-compatible REST surface** —
useful when you want the Anthropic SDK's own types, or a drop-in base-URL swap
for code already written against Anthropic directly.

---

## Connecting

```
Base URL: https://ai-gateway.vercel.sh
Endpoint: POST /v1/messages
```

Auth accepts either header form:
- `x-api-key: <key>`
- `Authorization: Bearer <token>`

Two credential sources: **`AI_GATEWAY_API_KEY`**, or **`VERCEL_OIDC_TOKEN`** when
running on Vercel with OIDC Federation enabled. The common pattern falls back:

```ts
import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
const anthropic = new Anthropic({ apiKey, baseURL: 'https://ai-gateway.vercel.sh' });

const message = await anthropic.messages.create({
  model: 'anthropic/claude-opus-5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, world!' }],
});
```

```python
import os, anthropic
client = anthropic.Anthropic(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh',
)
```

`anthropic.AsyncAnthropic` works identically for async.

**Model IDs are provider-prefixed** — `anthropic/claude-opus-5`, not
`claude-opus-5`. That prefix is what lets one endpoint serve many providers, and
it is the single most common porting mistake. Note that a non-Anthropic model
(e.g. `openai/gpt-5.6-sol`) can be driven through the *Anthropic* Messages shape;
the gateway maps the parameters across.

Raw HTTP:

```bash
curl -X POST "https://ai-gateway.vercel.sh/v1/messages" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"anthropic/claude-opus-5","max_tokens":1024,
       "messages":[{"role":"user","content":"Hello, world!"}]}'
```

---

## Streaming

```ts
const stream = await anthropic.messages.create({
  model: 'anthropic/claude-opus-5',
  max_tokens: 150,
  messages: [{ role: 'user', content: 'A one-sentence bedtime story.' }],
  temperature: 0.7,
  stream: true,
});

for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    process.stdout.write(event.delta.text);
  }
}
```

Python uses the context-manager form, which is not interchangeable with the TS shape:

```python
with client.messages.stream(model='anthropic/claude-opus-5', max_tokens=1024,
                            messages=[{'role': 'user', 'content': '…'}]) as stream:
    for text in stream.text_stream:
        print(text, end='', flush=True)
    final = stream.get_final_message()
```

---

## Extended thinking

```ts
const message = await anthropic.messages.create({
  model: 'anthropic/claude-sonnet-4.5',
  max_tokens: 8192,
  thinking: { type: 'enabled', budget_tokens: 5000 },
  messages: [{ role: 'user', content: 'Explain quantum entanglement simply.' }],
});

for (const block of message.content) {
  if (block.type === 'thinking') console.log('Thinking:', block.thinking);
  else if (block.type === 'text') console.log('Response:', block.text);
}
```

`content` becomes **heterogeneous** — reading `content[0].text` blindly will grab
a thinking block. Always branch on `block.type`. Thinking blocks carry a
`signature` field. In Python pass `thinking={…}` directly; via curl it is a
top-level `thinking` key.

---

## Tools and web search

Standard Anthropic tool definitions pass straight through:

```python
tools = [{
    'name': 'get_weather',
    'description': 'Get the current weather for a location',
    'input_schema': {
        'type': 'object',
        'properties': {'location': {'type': 'string'}},
        'required': ['location'],
    },
}]
message = client.messages.create(model='anthropic/claude-opus-5', max_tokens=1024,
                                 messages=[…], tools=tools)
for block in message.content:
    if block.type == 'tool_use':
        print(block.name, block.input)
```

**Server-side web search** needs no execution loop from you:

```json
{
  "model": "anthropic/claude-opus-5",
  "max_tokens": 2048,
  "tools": [{ "type": "web_search_20250305", "name": "web_search" }],
  "messages": [{ "role": "user", "content": "Latest developments in quantum computing?" }]
}
```

Via the AI SDK instead: `tools: { web_search: anthropic.tools.webSearch_20250305() }`.

---

## Structured outputs

JSON-schema-constrained output, currently behind a beta header:

```python
with client.messages.stream(
    model='anthropic/claude-sonnet-5',
    max_tokens=2048,
    messages=[{'role': 'user', 'content': 'A recipe for classic Italian lasagna.'}],
    extra_body={'output_format': {'type': 'json_schema', 'schema': recipe_schema}},
    extra_headers={'anthropic-beta': 'structured-outputs-2025-11-13'},
) as stream:
    full = ''.join(stream.text_stream)
recipe = json.loads(full)
```

`output_format` goes in `extra_body` because it is a gateway extension the typed
SDK doesn't model. Schemas want `additionalProperties: False` and an explicit
`required` list.

---

## Prompt caching

Mark reusable context with ephemeral cache control:

```json
{
  "role": "user",
  "content": "Analyze this document and summarize the key points.",
  "cache_control": { "type": "ephemeral" }
}
```

Put the cache breakpoint after the large stable prefix (system prompt, document,
tool definitions) — caching a block that changes every call buys nothing.

---

## Fast mode and service tiers

Two routes to lower latency:

```ts
// a) model suffix
model: 'anthropic/claude-opus-5-fast'

// b) gateway provider option
providerOptions: { gateway: { speed: 'fast' } }
```

In TS the second needs `// @ts-expect-error` — `providerOptions` is a gateway
extension the Anthropic types don't declare. In Python it goes in `extra_body`.

Service tiers target the underlying provider:

```ts
providerOptions: { openai: { serviceTier: 'priority' } }
```

**Verify what you actually got**, rather than assuming the request was honoured:

```ts
const meta = (message as any).provider_metadata?.gateway;
console.log('Served speed:', meta?.routing?.speed, 'Usage:', message.usage);
```

While streaming, `provider_metadata` arrives on the `message_delta` event, not on
the deltas.

---

## Gotchas

- **Provider prefix on every model ID.** The most common porting error.
- **`/v1/messages` for the Anthropic shape**, `/v1/chat/completions` for the
  OpenAI-compatible shape. Different SDK, different base path (`…vercel.sh/v1`).
- **`content` is an array of typed blocks.** With thinking or tools enabled,
  `content[0].text` is a bug.
- **Gateway extensions bypass the typed SDK** — `extra_body` in Python,
  `@ts-expect-error` in TS. If a parameter is rejected as unknown, it likely
  needs to travel that way.
- **OIDC needs a pull.** `VERCEL_OIDC_TOKEN` only reaches local dev after
  `vercel link && vercel env pull` — see the `vercel-system-env-and-cli` skill.
