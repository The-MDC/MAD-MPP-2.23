# "Requires One More Step" → Implementation Resource Links
> Each item from the action plan with the exact GitHub repos, docs, and tools needed to unblock it.
> Compiled: March 22, 2026

---

## 1. AA-SDK Gas Policy on Arbitrum Nova

**What's needed:** Alchemy API key + gas sponsorship policy configured for Arbitrum Nova/One.

| Resource | Link |
|----------|------|
| Alchemy Gas Sponsorship Tutorial (official) | https://github.com/alchemyplatform/sponsoring-userops |
| AA-SDK Monorepo (your fork) | https://github.com/The-MDC/aa-sdk |
| Smart Wallets Quickstart (your fork) | https://github.com/The-MDC/smart-wallets-quickstart |
| Gas Sponsorship Docs | https://www.alchemy.com/docs/wallets/react/sponsor-gas |
| Arbitrum × Alchemy Gas Credit Program | https://www.alchemy.com/blog/account-kit-arbitrum-gas |
| Conditional Gas Sponsorship (rule-based) | https://www.alchemy.com/docs/wallets/low-level-infra/gas-manager/gas-sponsorship/using-sdk/conditional-gas-sponsorship |

**Steps:** Sign up at dashboard.alchemy.com → Create app on Arbitrum Nova → Create Gas Manager Policy → Set spending rules (e.g. 100 sponsored ops/day) → Copy Policy ID into `createConfig()`.

---

## 2. Alchemy MCP Server for Arbitrum

**What's needed:** Alchemy API key + configure endpoints for Arbitrum Nova/One chains.

| Resource | Link |
|----------|------|
| Alchemy MCP Server (your fork) | https://github.com/The-MDC/alchemy-mcp-server |
| Alchemy MCP Server (upstream, latest) | https://github.com/alchemyplatform/alchemy-mcp-server |
| Alchemy SDK (supports Arbitrum) | https://github.com/The-MDC/aa-sdk |
| Alchemy Arbitrum Docs | https://docs.alchemy.com/reference/arbitrum-api-quickstart |

**Steps:** Clone → set `ALCHEMY_API_KEY` env var → configure `chainId: 42170` (Nova) or `42161` (One) → deploy as Docker service alongside Scraper.

---

## 3. Chainlink VRF v2.5 on Arbitrum Sepolia

**What's needed:** VRF Coordinator address, key hash, subscription ID, and LINK funding on Arbitrum Sepolia.

| Resource | Link |
|----------|------|
| **Foundry Chainlink Toolkit (official)** | https://github.com/smartcontractkit/foundry-chainlink-toolkit |
| Chainlink VRF v2.5 Getting Started (Solidity) | https://docs.chain.link/vrf/v2-5/getting-started |
| VRF Arbitrum Gas Estimation Script | https://github.com/smartcontractkit/smart-contract-examples/tree/main/vrf-arbitrum-gas-estimation |
| Chainlink Contracts (install via forge) | https://github.com/smartcontractkit/chainlink-brownie-contracts |
| VRF Subscription Manager (Arbitrum Sepolia) | https://vrf.chain.link/arbitrum-sepolia |
| VRF Supported Networks (addresses + key hashes) | https://docs.chain.link/vrf/v2-5/supported-networks |
| Chainlink Faucet (testnet LINK) | https://faucets.chain.link/arbitrum-sepolia |
| Your Chainlink forks | https://github.com/MADdegen/chainlink-vrf / https://github.com/MADdegen/chainlink-relay |
| Foundry VRF Raffle Example (best reference) | https://github.com/Cyfrin/foundry-smart-contract-lottery |

**Arbitrum Sepolia VRF v2.5 Addresses:**
- VRF Coordinator: `0x5CE8D5A2BC84beb22a398CCA51996F7930313D61`
- Key Hash (150 gwei): `0x1770bdc7eec7891f6805e5c6e90be7efd898ea079cb0ce53b2dab6b7d5e3f2b7`
- LINK Token: `0xb1D4538B4571d411F07960EF2838Ce337FE1E80E`

**Steps:** `forge install smartcontractkit/foundry-chainlink-toolkit` → Create subscription at vrf.chain.link/arbitrum-sepolia → Fund with testnet LINK from faucet → Add consumer contract → Deploy OracleIntegration.sol referencing coordinator address.

---

## 4. CrewAI vs Agent Squad Evaluation

**What's needed:** Side-by-side comparison to choose one framework for AI Agent Arena.

| Resource | Link |
|----------|------|
| CrewAI (your fork, 197K) | https://github.com/The-MDC/crewAI |
| Agent Squad (your fork, 68K) | https://github.com/The-MDC/agent-squad |
| Agent Framework (your fork, 49K) | https://github.com/The-MDC/agent-framework |
| CrewAI Docs (official) | https://github.com/crewAIInc/crewAI |
| Agent Squad Docs (AWS) | https://github.com/awslabs/agent-squad |
| MCP Agent (your fork) | https://github.com/MADdegen/mcp-agent |
| CrewAI + MCP Integration Example | https://github.com/crewAIInc/crewAI/tree/main/docs |
| Instructor (structured outputs) | https://github.com/MADdegen/instructor |

**Recommendation:** CrewAI for production (larger community, better docs, role-playing fits our 3-tier agent model). Agent Squad as fallback for AWS-native deployments. MCP Agent for blockchain-specific tool integration.

---

## 5. GraphRAG Entertainment Corpus

**What's needed:** Entertainment news corpus for initial knowledge graph indexing.

| Resource | Link |
|----------|------|
| GraphRAG (your fork) | https://github.com/MADdegen/graphrag |
| GraphRAG (upstream Microsoft) | https://github.com/microsoft/graphrag |
| GDELT Project (global event database) | https://github.com/linwoodc3/gdelt2HeaderRows |
| NewsAPI.org (entertainment headlines) | https://github.com/SlapBot/newsapi |
| Reddit Entertainment Scraper | https://github.com/pushshift/api |
| Common Crawl News Dataset | https://github.com/commoncrawl/news-crawl |
| Celebrity News Dataset (academic) | https://github.com/yalesentimental/celebrity-news |
| WebThinker (your fork — web research agent) | https://github.com/The-MDC/WebThinker |

**Steps:** Use WebThinker to crawl entertainment news sources → Export as JSON corpus → Feed into GraphRAG indexing pipeline → Build entity relationship graph (celebrities ↔ scandals ↔ outcomes) → Query for market recommendations.

---

## 6. Qwen-Image Fine-Tuning Dataset

**What's needed:** Satirical card art dataset for fine-tuning Pixar-style caricature generation.

| Resource | Link |
|----------|------|
| Qwen-Image (your fork) | https://github.com/The-MDC/Qwen-Image |
| Qwen-Image (upstream) | https://github.com/QwenLM/Qwen-Image |
| LoRA Fine-Tuning for Diffusion Models | https://github.com/cloneofsimo/lora |
| Kohya SS (stable diffusion fine-tuning) | https://github.com/bmaltais/kohya_ss |
| DreamBooth Training | https://github.com/ShivamShrirao/diffusers/tree/main/examples/dreambooth |
| SDXL LoRA Training Script | https://github.com/huggingface/diffusers/blob/main/examples/text_to_image/train_text_to_image_lora_sdxl.py |
| Open-Sora (your fork — video gen) | https://github.com/The-MDC/Open-Sora |

**Steps:** Collect 50-100 reference images in the target Pixar-satirical style → Create caption pairs → Fine-tune with LoRA (lower cost than full fine-tune) → Test generation: "satirical caricature of [celebrity], Pixar style, neon background, dramatic lighting" → Integrate into Scandal Scraper pipeline.

---

## 7. Light-Account vs Privy Architecture Decision

**What's needed:** Choose between Alchemy's native AA (light-account) or Privy's managed embedded wallets.

| Resource | Link |
|----------|------|
| Alchemy Light Account (your fork) | https://github.com/The-MDC/light-account |
| Alchemy Modular Account (your fork) | https://github.com/The-MDC/modular-account |
| AA Benchmarks (your fork) | https://github.com/The-MDC/aa-benchmarks |
| Privy Smart Wallets Starter (official) | https://github.com/privy-io/smart-wallets-starter |
| Privy + Alchemy Paymaster Example | https://github.com/privy-io/base-paymaster-example |
| Privy + Biconomy Smart Accounts | https://github.com/privy-io/biconomy-example |
| Privy Next.js Smart Wallet Starter | https://github.com/builders-garden/privy-smart-wallet-nextjs-starter |
| Alchemy Account Kit Docs | https://www.alchemy.com/docs/wallets |
| Privy Docs | https://docs.privy.io/guide/react/quickstart |

**Recommendation:** Use BOTH — Privy for auth (email/social login, the UX layer) + Alchemy AA-SDK for the smart wallet (gas sponsorship, transaction batching). Privy handles the login modal; Alchemy handles the on-chain wallet. This is the pattern used in `privy-io/base-paymaster-example`.

**Architecture:**
```
User → Privy (email/Google/Apple login)
  → Creates embedded EOA wallet
    → Alchemy AA-SDK wraps it in a Smart Account
      → Gas Manager sponsors all transactions
        → User never sees gas, wallets, or chains
```

---

## SUMMARY: 47 Resource Links Across 7 Items

| Item | Repos/Links | Ready to Build? |
|------|-------------|----------------|
| 1. AA-SDK Gas Policy | 6 links | ✅ Yes — sign up + configure |
| 2. Alchemy MCP Server | 4 links | ✅ Yes — env var + deploy |
| 3. Chainlink VRF | 9 links + addresses | ✅ Yes — forge install + fund |
| 4. CrewAI vs Agent Squad | 8 links | ✅ Yes — evaluate + choose |
| 5. GraphRAG Corpus | 8 links | 🔨 Need to crawl first |
| 6. Qwen-Image Fine-Tune | 7 links | 🔨 Need reference images |
| 7. Light-Account vs Privy | 9 links | ✅ Yes — use both pattern |

---

*All 7 "one more step" items now have concrete GitHub repos, documentation, and implementation paths. Items 1-4 and 7 can begin immediately. Items 5-6 require data collection before implementation.*
