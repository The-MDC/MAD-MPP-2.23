import { NextResponse } from 'next/server';
import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { getDbPool } from '@/lib/db';
import { requireBearerSecret } from '@/lib/bearer-secret';

const TraderState = Annotation.Root({
  targetTrade: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  newsContext: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  validationStatus: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "PENDING",
  }),
  signedTx: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
});

async function surveillanceNode(state: typeof TraderState.State) {
  console.log("== [Surveillance Node] Monitoring Whales ==");
  // Simulate fetching a whale trade from Polymarket CTF
  const simulatedWhaleTrade = {
    marketId: "0x123...abc",
    marketTitle: "Will [Celebrity] be arrested this week?",
    action: "BUY",
    outcome: "YES",
    amountUSDC: 50000,
  };
  return { targetTrade: simulatedWhaleTrade };
}

async function validationNode(state: typeof TraderState.State) {
  console.log("== [Validation Node] Fact-checking against Vector DB ==");
  if (!state.targetTrade) return { validationStatus: "REJECTED" };

  const pool = getDbPool();
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
  });

  const queryVector = await embeddings.embedQuery(state.targetTrade.marketTitle);
  
  // Query Postgres pgvector using cosine distance (<=>)
  // We look for intelligence closely matching the market topic
  const res = await pool.query(
    `SELECT title, content, 1 - (embedding <=> $1::vector) as similarity 
     FROM market_intelligence 
     WHERE 1 - (embedding <=> $1::vector) > 0.6
     ORDER BY similarity DESC LIMIT 3`,
    [`[${queryVector.join(',')}]`]
  );

  const context = res.rows;

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3.1-pro",
    temperature: 0.2,
  });

  const prompt = `
You are a Prediction Market Trading Agent evaluating a copy-trade.
A whale just bought ${state.targetTrade.amountUSDC} USDC on "${state.targetTrade.outcome}" for the market: "${state.targetTrade.marketTitle}".

Here is the latest intelligence from our vector database:
${JSON.stringify(context, null, 2)}

Determine if this is a legitimate trade backed by real scandal/news, or if it is a liquidity trap.
Output exactly one word: APPROVED or REJECTED.
`;

  const response = await llm.invoke(prompt);
  const decision = response.content.toString().trim().toUpperCase();
  
  return { 
    validationStatus: decision.includes("APPROVED") ? "APPROVED" : "REJECTED",
    newsContext: context
  };
}

async function executionNode(state: typeof TraderState.State) {
  console.log("== [Execution Node] Signing Transaction ==");
  if (state.validationStatus === "APPROVED") {
    // In production, use viem and the CTF Exchange ABI to format and sign the tx
    // For now, we mock the signed payload
    const mockTx = `0xSIGNED_TX_${Date.now()}_BUY_${state.targetTrade.outcome}`;
    return { signedTx: mockTx };
  }
  return { signedTx: "NONE_REJECTED" };
}

const workflow = new StateGraph(TraderState)
  .addNode("surveillance", surveillanceNode)
  .addNode("validation", validationNode)
  .addNode("execution", executionNode)
  .addEdge(START, "surveillance")
  .addEdge("surveillance", "validation")
  .addEdge("validation", "execution")
  .addEdge("execution", END);

const app = workflow.compile();

// Internal simulated-copy-trade pipeline (a whale-trade fixture, a vector-DB
// lookup, an LLM approve/reject call) with no user-facing purpose today — no
// params, no per-caller behavior. Same reasoning as agents/scraper: gated
// with CRON_SECRET rather than rate-limited, since there's no legitimate
// anonymous caller to rate-limit in the first place.
export async function POST(req: Request) {
  const auth = requireBearerSecret(req, "CRON_SECRET");
  if (auth) return auth;

  try {
    const finalState = await app.invoke({
      targetTrade: null,
      newsContext: [],
      validationStatus: "PENDING",
      signedTx: ""
    });
    return NextResponse.json({ success: true, data: finalState });
  } catch (error: any) {
    console.error("Trader Agent Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
