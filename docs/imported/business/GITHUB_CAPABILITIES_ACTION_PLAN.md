# GITHUB CAPABILITIES AUDIT & PRIORITIZED ACTION PLAN
> Analyzed: March 22, 2026
> Accounts: The-MDC (46 repos) + MADdegen (45 repos) = 91 total repositories
> Purpose: Inventory all capabilities, prioritize for MAD Gambit implementation

---

## EXECUTIVE SUMMARY

Across both GitHub accounts there are **91 repositories** containing production-ready tools, SDKs, frameworks, and reference implementations directly applicable to MAD Gambit. The most impactful are the **Alchemy Account Abstraction SDK** (gasless smart wallets — our Privy replacement/complement), the **Alchemy MCP Server** (AI agent blockchain interaction), the **Chainlink ecosystem forks** (our Triple-Threat Oracle), and the **multi-agent orchestration frameworks** (Scandal Scraper AI, AI Agent Arena).

---

## TIER 1 — IMPLEMENT NOW (Direct MAD Gambit Impact)

### 1.1 Alchemy Account Abstraction SDK (`The-MDC/aa-sdk`)
**What:** Complete smart wallet SDK with embedded accounts, passkeys, gas sponsorship, transaction batching. Next.js compatible.
**Why:** This IS the "Web2-smooth wrapper over Web3 rails" we promise. Email signup → auto wallet → gasless betting. Replaces/complements Privy.
**Action:**
- [ ] Clone into `packages/wallet/` in monorepo
- [ ] Integrate `@account-kit/react` into Next.js frontend
- [ ] Configure gas sponsorship policy for prediction bets
- [ ] Test: email signup → first bet → zero gas prompts
**Sprint:** 1-2 (Foundation + Contracts)
**Effort:** 3-5 days

### 1.2 Alchemy Smart Wallets Quickstart (`The-MDC/smart-wallets-quickstart`)
**What:** Working Next.js template with embedded smart wallets UI.
**Why:** Drop-in starter for our frontend. Already configured for passkeys + social login.
**Action:**
- [ ] Use as scaffolding base for `apps/web/` in our monorepo
- [ ] Merge with our design system (Orbitron/Rajdhani/dark theme)
- [ ] Add prediction market contract hooks on top
**Sprint:** 4 (Frontend Core)
**Effort:** 2-3 days

### 1.3 Alchemy MCP Server (`The-MDC/alchemy-mcp-server`)
**What:** MCP server for AI agents to query blockchain data — balances, transactions, token info, NFT metadata.
**Why:** Powers our AI Agent Arena. Agents can read on-chain state, check market positions, query card ownership without custom code.
**Action:**
- [ ] Deploy as microservice alongside Scandal Scraper
- [ ] Configure for Arbitrum Nova/One endpoints
- [ ] Connect to AI Agent Arena backend (LangChain tool)
- [ ] Enable: "Check my $MADx balance", "Show my card collection", "What are top markets by volume"
**Sprint:** Phase 2 (AI Agent Arena)
**Effort:** 2-3 days

### 1.4 Chainlink Ecosystem (`MADdegen/chainlink`, `chainlink-vrf`, `chainlink-relay`, `chainlink-testing-framework`)
**What:** Full Chainlink node, VRF implementation, relay contracts, and testing framework.
**Why:** Our Triple-Threat Oracle Tier 1 runs on Chainlink VRF + Automation. These forks give us the source code, test harness, and relay patterns.
**Action:**
- [ ] Extract VRF v2.5 integration patterns from `chainlink-vrf`
- [ ] Use `chainlink-testing-framework` for Oracle integration tests
- [ ] Reference `chainlink-relay` for our OracleIntegration.sol adapter
- [ ] Build: OracleIntegration.sol using relay patterns
**Sprint:** 3 (Backend) + Phase 2 (Oracle)
**Effort:** 5-8 days

### 1.5 Light Account + Modular Account (`The-MDC/light-account`, `modular-account`)
**What:** ERC-4337 smart account implementations — lightweight and modular versions. Production-audited Solidity.
**Why:** If we build our own account abstraction (instead of pure Alchemy SDK), these are the proven contract templates. Modular account supports plugins — we could build a "prediction market plugin" for smart wallets.
**Action:**
- [ ] Evaluate light-account for MVP (simpler, lower gas)
- [ ] Plan modular-account for Phase 3 (plugin architecture)
- [ ] Reference gas benchmarks from `aa-benchmarks`
**Sprint:** 2 (Contracts)
**Effort:** 3-5 days

### 1.6 Frontend Template (`The-MDC/frontend-template`)
**What:** Next.js starter using agent best practices.
**Why:** Clean scaffolding aligned with our tech stack choice.
**Action:**
- [ ] Merge structure into `apps/web/` alongside smart-wallets-quickstart
- [ ] Apply our design tokens (colors, fonts, glassmorphism)
**Sprint:** 1 (Foundation)
**Effort:** 1-2 days

---

## TIER 2 — IMPLEMENT THIS SPRINT (Development Infrastructure)

### 2.1 Claude Code Best Practices (`The-MDC/claude-code-best-practice`)
**What:** 26K+ repository of Claude Code patterns, rules, and best practices.
**Why:** Optimizes our entire development workflow with Claude Code CLI. Better prompting = faster builds.
**Action:**
- [ ] Extract `.claude/` rules into our monorepo
- [ ] Adopt coding conventions for all services
- [ ] Implement CLAUDE.md per service directory
**Effort:** 1 day

### 2.2 Claude Code Hooks (`The-MDC/claude-code-hooks`)
**What:** 23 hook implementations for Claude Code — pre-commit, post-build, linting, etc.
**Why:** Automated quality gates during development.
**Action:**
- [ ] Install hooks in monorepo `.claude/hooks/`
- [ ] Configure: auto-lint on save, test on commit, Slither on .sol changes
**Effort:** 1 day

### 2.3 Claude Code Multi-Agent Orchestration (`The-MDC/claude-code-multi-agent-orchestrartion`)
**What:** Run parallel Claude agents for different tasks.
**Why:** Sprint 3-4 parallelization — one agent on backend, one on frontend, one on contracts simultaneously.
**Action:**
- [ ] Study orchestration pattern
- [ ] Apply to parallel service development in Sprint 3-4
**Effort:** 0.5 days

### 2.4 Claude Code Toolkit (`The-MDC/claude-code-toolkit`)
**What:** Agents, skills, and hooks that make Claude Code work as a team.
**Why:** Systematic development methodology for the entire build.
**Action:**
- [ ] Adopt toolkit structure for our project
- [ ] Configure per-service agent roles
**Effort:** 1 day

### 2.5 Claude Code Rules (`The-MDC/claude-code-rules`)
**What:** Curated list of effective Claude Code rules.
**Why:** Project-wide coding standards.
**Action:**
- [ ] Review and adopt relevant rules
- [ ] Add MAD Gambit-specific rules (1.88% fee, contract naming, etc.)
**Effort:** 0.5 days

### 2.6 Codex CLI Best Practice (`The-MDC/codex-cli-best-practice`)
**What:** OpenAI Codex CLI patterns.
**Why:** Alternative AI coding tool reference.
**Action:**
- [ ] Cross-reference patterns with Claude Code practices
- [ ] Adopt any unique patterns not covered by Claude
**Effort:** 0.5 days

---

## TIER 3 — IMPLEMENT IN PHASE 2-3 (Feature Enhancement)

### 3.1 AI SDK for TypeScript (`The-MDC/claude-AIToolkit-for-TypeScript`)
**What:** 166K repo — provider-agnostic AI toolkit for Next.js/React/Node. Streaming, tool use, structured outputs.
**Why:** Powers our AI Agent Arena frontend — streaming responses, tool calling, structured bet recommendations.
**Action:**
- [ ] Integrate `ai` package into frontend for AI assistant UI
- [ ] Use structured outputs for market proposals from Scandal Scraper
- [ ] Build streaming chat interface for AI Agent tiers
**Sprint:** Phase 2-3 (AI Agent Arena)
**Effort:** 3-5 days

### 3.2 MCP Agent (`MADdegen/mcp-agent`)
**What:** Framework for building effective agents using MCP.
**Why:** Our AI agents (Scandal Scraper, trading bots) need MCP integration.
**Action:**
- [ ] Use as foundation for Scandal Scraper AI agent
- [ ] Connect to alchemy-mcp-server for on-chain data
- [ ] Build market proposal pipeline: trend detection → market creation
**Sprint:** Phase 2
**Effort:** 5-8 days

### 3.3 Instructor (`MADdegen/instructor`)
**What:** Structured outputs for LLMs — Pydantic-validated responses.
**Why:** Scandal Scraper needs structured market proposals (title, outcomes, resolution criteria, end time).
**Action:**
- [ ] Use instructor for market proposal schema validation
- [ ] Define MarketProposal, ScandalCard, RiskAssessment schemas
**Sprint:** Phase 2
**Effort:** 2-3 days

### 3.4 GraphRAG (`MADdegen/graphrag`)
**What:** Graph-based Retrieval-Augmented Generation by Microsoft.
**Why:** Build a knowledge graph of celebrity scandals, prediction outcomes, and market patterns for the Scandal Scraper.
**Action:**
- [ ] Index historical entertainment events
- [ ] Build scandal knowledge graph for market recommendations
- [ ] Power "Related Markets" feature on market detail page
**Sprint:** Phase 3
**Effort:** 5-10 days

### 3.5 OpenManus (`The-MDC/OpenManus`)
**What:** Open-source computer-use agent framework.
**Why:** Automated testing — agents that can navigate the MAD Gambit UI, place bets, open packs, evolve cards.
**Action:**
- [ ] Configure for E2E testing of the platform
- [ ] Build automated user journey tests
**Sprint:** Sprint 6 (QA) + Phase 2
**Effort:** 3-5 days

### 3.6 CrewAI (`The-MDC/crewAI`)
**What:** 197K repo — framework for role-playing autonomous AI agents.
**Why:** AI Agent Arena's 3-tier system (Basic/Degen/MADHATTER) can be built as CrewAI crews with different roles.
**Action:**
- [ ] Design crew templates for each AI agent tier
- [ ] Basic: single analysis agent; Degen: analyst + trader; MADHATTER: full crew
**Sprint:** Phase 3
**Effort:** 5-8 days

### 3.7 Agent Squad + Agent Framework (`The-MDC/agent-squad`, `agent-framework`)
**What:** Multi-agent orchestration frameworks (68K + 49K repos).
**Why:** Alternative to CrewAI for our AI Agent Arena — more flexible orchestration.
**Action:**
- [ ] Evaluate vs CrewAI for best fit
- [ ] Choose one framework for production AI agents
**Sprint:** Phase 2-3
**Effort:** 2-3 days (evaluation)

### 3.8 Mem0 (`The-MDC/mem0`)
**What:** Universal memory layer for AI agents — persistent context across sessions.
**Why:** AI Agent Arena agents that remember user preferences, past bets, winning patterns.
**Action:**
- [ ] Integrate mem0 as memory layer for AI agents
- [ ] Store: user bet history, preferred markets, risk profile
**Sprint:** Phase 3
**Effort:** 3-5 days

---

## TIER 4 — IMPLEMENT IN PHASE 4+ (Ecosystem)

### 4.1 WebThinker (`The-MDC/WebThinker`)
**What:** NeurIPS 2025 — web-augmented reasoning for LLMs.
**Why:** Deep research agent for Scandal Scraper — can browse gossip sites, news, social media.
**Action:**
- [ ] Use as Scandal Scraper's web research module
- [ ] Configure for entertainment news sources
**Sprint:** Phase 3-4

### 4.2 Qwen-Image (`The-MDC/Qwen-Image`)
**What:** Image generation foundation model.
**Why:** Auto-generate satirical card art for new Scandal Cards from the Scraper.
**Action:**
- [ ] Fine-tune for Pixar-style satirical caricature generation
- [ ] Pipeline: Scandal detected → card art generated → card minted
**Sprint:** Phase 4

### 4.3 Open-Sora (`The-MDC/Open-Sora`)
**What:** Open-source video production model.
**Why:** Marketing content — automated video trailers for new Saga Seasons, tournament promos.
**Sprint:** Phase 4+

### 4.4 Go-Ethereum (`The-MDC/go-ethereum`)
**What:** Official Geth client.
**Why:** Reference implementation for any custom EVM work. Not directly needed unless running our own node.
**Sprint:** Phase 4+ (if self-hosting)

### 4.5 Hono/HonoX (`MADdegen/hono`, `honox`)
**What:** Ultra-fast web framework built on Web Standards.
**Why:** Alternative to Express/NestJS for lightweight microservices. Could power the API gateway.
**Sprint:** Phase 4 (optimization)

### 4.6 EVM Tools (`The-MDC/evm-tools`)
**What:** Disassembler, debugger, and EVM utilities.
**Why:** Smart contract debugging and gas optimization.
**Sprint:** Sprint 6 (QA) + ongoing

### 4.7 Alchemy Collections (`The-MDC/collections`)
**What:** 200+ pre-configured blockchain API requests.
**Why:** Ready-made Postman/API collections for testing Arbitrum interactions.
**Sprint:** Sprint 2-3

### 4.8 Alchemy x402 (`The-MDC/alchemy-x402`)
**What:** SIWE/SIWS authentication + per-request payments.
**Why:** Advanced auth pattern for creator dashboard — Sign-In With Ethereum.
**Sprint:** Phase 2

### 4.9 Alchemy Lab (`The-MDC/lab`)
**What:** 7+ years of Alchemy's Web3 learnings.
**Why:** Reference architecture, lessons learned, scaling patterns.
**Sprint:** Ongoing reference

### 4.10 AA Benchmarks (`The-MDC/aa-benchmarks`)
**What:** Comprehensive ERC-4337 smart account gas benchmarks.
**Why:** Validate our gas targets (<150K per bet, <200K per mint).
**Sprint:** Sprint 2 + Sprint 6

### 4.11 Claude Agent SDK vs CLI (`The-MDC/claude-agent-sdk-vs-claude-code-cli`)
**What:** Dual-agent research system with self-evolving architecture.
**Why:** Development methodology — run research agents for market analysis.
**Sprint:** Ongoing

### 4.12 SuperManus (`The-MDC/SuperManus`)
**What:** Super Manus AI enhancement platform.
**Why:** Advanced agent capabilities.
**Sprint:** Phase 3-4

### 4.13 OpenR (`The-MDC/openr`)
**What:** Open reasoning framework.
**Why:** Enhanced reasoning for AI Agent Arena's MADHATTER tier.
**Sprint:** Phase 4

### 4.14 UOR Framework (`The-MDC/UOR-Framework`)
**What:** Universal Object Reference — Rust workspace for universal data representation.
**Why:** Research-grade framework, potentially useful for cross-chain data standards.
**Sprint:** Phase 4+

### 4.15 Market Data repos (`MADdegen/MarketData`, `PriceOracle`, `VolumeMetrics`, `EliteMeta`, `ChainAnalysis`)
**What:** Market data ingestion, price oracles, volume analytics, transition orchestration, chain analysis.
**Why:** Data infrastructure for our prediction markets — price feeds, volume tracking, chain analytics.
**Action:**
- [ ] Evaluate for integration with our backend services
- [ ] MarketData → Prediction Service volume tracking
- [ ] PriceOracle → $MADx price feed
- [ ] ChainAnalysis → WhaleWatcher feature
**Sprint:** Phase 2-3

---

## ALREADY IMPLEMENTED / ACTIVE

| Repo | Status | How Used |
|------|--------|----------|
| `The-MDC/demo-repository` | ✅ Active | Main data house — all docs, contracts, specs |
| `The-MDC/MADHATs-Gambit-Presentation` | ✅ Active | Live GitHub Pages presentation site |
| `The-MDC/MPP-2.0` | ✅ Active | MPP frontend (releasing) |
| `The-MDC/The-MADDEGENS` | ✅ Separate | Parent brand/ventures entity |
| `The-MDC/AI-Database` | ✅ Separate | AI model database (OpenRouter) |

---

## NOT RELEVANT / NOT NEEDED

| Repo | Account | Why Not Needed |
|------|---------|---------------|
| `alchemy-sdk-js` | The-MDC | Deprecated Jan 2026, replaced by aa-sdk |
| `alchemy-web3` | The-MDC | Maintenance mode, replaced by aa-sdk |
| `Claude-Skills-MCPs-Features` | The-MDC | Empty placeholder (0 files) |
| `Alchemy-Related` | The-MDC | Empty placeholder (0 files) |
| `claude-code-status-line` | The-MDC | Nice-to-have cosmetic, not project-critical |
| `shanraisshan` | The-MDC | Personal profile repo |
| `MockApis` | The-MDC | Testing APIs — generic |
| `gql` | MADdegen | Go GraphQL lib — we use TypeScript |
| `go-docker-test` | MADdegen | Go Docker testing |
| `docker` | MADdegen | Generic Dockerfiles |
| `todo` | MADdegen | Simple Go todo app |
| `go-web-sql` | MADdegen | Go web+SQL app |
| `logprinter` | MADdegen | Go logging adapter |
| `mustlog` | MADdegen | Go logging extension |
| `web3dart` | MADdegen | Dart Ethereum lib — we use TypeScript |
| `contexts` | MADdegen | Go contexts package |
| `nuts` | MADdegen | BoltDB utilities |
| `ginprom` | MADdegen | Gin Prometheus — we use NestJS |
| `grpc-proxy` | MADdegen | Go gRPC proxy |
| `curl` | MADdegen | Ethereum JSON-RPC CLI |
| `go-plugin` | MADdegen | Go plugin system |
| `tdh2` | MADdegen | TDH2 protocol implementation |
| `testify` | MADdegen | Go testing toolkit |
| `libocr` | MADdegen | OCR library (related to Chainlink but low-level) |
| `jsonseq` | MADdegen | JSON sequence reader |
| `ubjson` | MADdegen | Universal Binary JSON |
| `chainload` | MADdegen | Blockchain load generator |
| `gochain` | MADdegen | GoChain client (not Arbitrum) |
| `wgo` | MADdegen | WGO DeFi contract |
| `docs` | MADdegen | GoChain docs |
| `web3` | MADdegen | CLI web3 tool — we use SDK |
| `awesome-transformer-nlp` | MADdegen | NLP resources list — reference only |
| `kite-mcp-server` | MADdegen | Zerodha Kite (Indian trading) — not relevant |
| `auxdrone` | MADdegen | AuxDrone — not relevant |
| `436b_dita-ot-docs` | MADdegen | Documentation toolchain |
| `meshi-mcp` | MADdegen | "Nothing to see yet" |
| `ramen-api` | MADdegen | Ramen API — not relevant |
| `registry` | MADdegen | Generic registry |

---

## IMPLEMENTATION TIMELINE

### Week 1 (Sprint 1 — Foundation)
- [ ] Set up monorepo with `frontend-template` + `smart-wallets-quickstart` scaffolding
- [ ] Import `claude-code-best-practice` rules + `claude-code-hooks` into `.claude/`
- [ ] Import `claude-code-rules` for project standards
- [ ] Configure `claude-code-toolkit` structure per service

### Week 2 (Sprint 2 — Contracts)
- [ ] Reference `light-account` for account abstraction contracts
- [ ] Use `aa-benchmarks` to validate gas targets
- [ ] Extract Chainlink VRF patterns from `chainlink-vrf`
- [ ] Reference `collections` for Arbitrum API testing

### Week 3-4 (Sprint 3-4 — Backend + Frontend)
- [ ] Integrate `aa-sdk` Smart Wallets into frontend
- [ ] Use `claude-code-multi-agent-orchestrartion` for parallel development
- [ ] Deploy `alchemy-mcp-server` for AI blockchain queries
- [ ] Reference `alchemy-x402` for auth patterns

### Week 5-8 (Sprint 5-6 + Phase 2)
- [ ] Build AI Agent Arena using `claude-AIToolkit-for-TypeScript` + `mcp-agent`
- [ ] Implement Scandal Scraper with `instructor` for structured outputs
- [ ] Use `OpenManus` for E2E automated testing
- [ ] Evaluate `crewAI` vs `agent-squad` for AI agent architecture

### Phase 3-4 (Months 3-6)
- [ ] Integrate `graphrag` for scandal knowledge graph
- [ ] `mem0` for persistent AI agent memory
- [ ] `WebThinker` for deep web research in Scraper
- [ ] `Qwen-Image` for automated card art generation
- [ ] `Open-Sora` for marketing video content
- [ ] Market data repos for analytics infrastructure

---

## SUMMARY COUNTS

| Category | Count | Key Value |
|----------|-------|-----------|
| **Implement Now (Tier 1)** | 6 repos | Smart wallets, Chainlink, frontend scaffolding |
| **Dev Infrastructure (Tier 2)** | 6 repos | Claude Code tools, hooks, rules, multi-agent |
| **Phase 2-3 Features (Tier 3)** | 8 repos | AI agents, GraphRAG, CrewAI, memory |
| **Phase 4+ Ecosystem (Tier 4)** | 15 repos | Image gen, video, Hono, EVM tools, analytics |
| **Already Active** | 5 repos | demo-repository, presentation, MPP, MADDEGENS, AI-DB |
| **Not Relevant** | 35 repos | Go utilities, deprecated SDKs, unrelated projects |
| **Total Analyzed** | 91 repos | |

---

*Prepared March 22, 2026. Priority order based on MAD Gambit development sprints and the Design Brief screen specifications.*

---

## NEW: DEDICATED IMPLEMENTATION REPOS (Created March 22, 2026)

| # | Repo | Purpose | Key Contents | Status |
|---|------|---------|-------------|--------|
| 4 | [MAD-AI-Agent-Stack](https://github.com/The-MDC/MAD-AI-Agent-Stack) | CrewAI + DeepSeek-R1 + Ollama | Scandal Scraper crew, Basic/Degen/MADHATTER agents, Pydantic schemas, Ollama installer | ✅ Ready |
| 5 | [MAD-Scandal-Corpus](https://github.com/The-MDC/MAD-Scandal-Corpus) | GDELT + GossipCop + GraphRAG | GDELT scanner (8 themes), market scoring, GraphRAG indexer | ✅ Ready |
| 6 | [MAD-Card-Art-Generator](https://github.com/The-MDC/MAD-Card-Art-Generator) | FLUX + LoRA card art pipeline | Pixar/Caricature LoRA generator, 8 faction prompts, HF API fallback | ✅ Ready |
| 7 | [MAD-Smart-Wallet-Stack](https://github.com/The-MDC/MAD-Smart-Wallet-Stack) | Privy + Alchemy AA-SDK | WalletProvider, useSmartWallet hook, Gas Policy config, .env template | ✅ Ready |

**The-MDC now has 52 repositories total.**
