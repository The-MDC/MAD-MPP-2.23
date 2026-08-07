import { NextResponse } from 'next/server';
import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { fetchAllFeeds } from '@/lib/rss-feeds';
import { getDbPool } from '@/lib/db';

// 1. Define State
const ScraperState = Annotation.Root({
  rawNews: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  analyzedEvents: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  vectorIds: Annotation<number[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// 2. Nodes
async function discoveryNode(state: typeof ScraperState.State) {
  console.log("== [Discovery Node] Fetching real-time trending news ==");
  const items = await fetchAllFeeds();
  // Filter for potential viral markers (borrowed from gdelt_entertainment.py heuristics)
  const viralityMarkers = ['scandal', 'arrest', 'divorce', 'feud', 'fired', 'will', 'could', 'might', 'rumor', 'expect', 'breaking'];
  
  const highPotentialNews = items.filter(item => {
    const title = item.title.toLowerCase();
    return viralityMarkers.some(marker => title.includes(marker));
  }).slice(0, 5); // Limit to top 5 for LLM processing

  return { rawNews: highPotentialNews };
}

async function reasoningNode(state: typeof ScraperState.State) {
  console.log("== [Reasoning Node] Analyzing news for prediction markets ==");
  if (state.rawNews.length === 0) return { analyzedEvents: [] };

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3.1-pro",
    temperature: 0.3,
  });

  const prompt = `
You are a Prediction Market Analyst (like a Grok-class reasoning agent).
Evaluate the following trending events and determine if they are suitable for a prediction market.

Each event includes source metadata (trust_score, satire_flag, virality_weight) that MUST alter your algorithmic scoring:
- If satire_flag is TRUE (e.g. The Onion), probabilistically accept it as a Meme/Satire market. Do not penalize it for low Verifiability. Frame the market resolution around "Will [Satirical Event] go viral?".
- If trust_score is LOW (Tabloids), require a higher intrinsic Virality Score for it to be accepted, but boost the Virality Score using the provided virality_weight multiplier.

Criteria (Base Scores before multipliers):
1. Verifiability Score (1-10): Can the outcome be objectively verified?
2. Timing Score (1-10): Is there a clear resolution timeframe?
3. Virality Score (1-10): Will enough people care to bet?
4. Uncertainty Score (1-10): Is the outcome genuinely uncertain?

For events that score 7+ overall (after applying source multipliers), output a JSON array of market proposals.
Schema:
[{
  "title": "Will [event]?",
  "description": "...",
  "outcomes": ["YES", "NO"],
  "resolution_criteria": "...",
  "end_timestamp": "ISO 8601",
  "category": "Hollywood|Tech|Sports|Music|Meme",
  "suggested_card_name": "Satirical card name",
  "source_url": "..."
}]

Events to analyze:
${JSON.stringify(state.rawNews, null, 2)}

Return ONLY valid JSON array.
`;

  const response = await llm.invoke(prompt);
  let analyzedEvents = [];
  try {
    const text = response.content.toString().replace(/```json/g, '').replace(/```/g, '').trim();
    analyzedEvents = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse LLM output", e);
  }

  return { analyzedEvents };
}

async function vectorNode(state: typeof ScraperState.State) {
  console.log("== [Vector Node] Embedding and storing intelligence ==");
  if (state.analyzedEvents.length === 0) return { vectorIds: [] };

  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
  });

  const pool = getDbPool();
  const vectorIds: number[] = [];

  for (const event of state.analyzedEvents) {
    const contentToEmbed = `Title: ${event.title}\nDescription: ${event.description}\nCategory: ${event.category}`;
    const vector = await embeddings.embedQuery(contentToEmbed);
    
    const res = await pool.query(
      `INSERT INTO market_intelligence (title, content, url, metadata, embedding)
       VALUES ($1, $2, $3, $4, $5::vector) RETURNING id`,
      [
        event.title,
        event.description,
        event.source_url || '',
        event,
        `[${vector.join(',')}]`
      ]
    );
    vectorIds.push(res.rows[0].id);
  }

  return { vectorIds };
}

// 3. Build Graph
const workflow = new StateGraph(ScraperState)
  .addNode("discovery", discoveryNode)
  .addNode("reasoning", reasoningNode)
  .addNode("vector", vectorNode)
  .addEdge(START, "discovery")
  .addEdge("discovery", "reasoning")
  .addEdge("reasoning", "vector")
  .addEdge("vector", END);

const app = workflow.compile();

export async function POST() {
  try {
    const finalState = await app.invoke({ rawNews: [], analyzedEvents: [], vectorIds: [] });
    return NextResponse.json({ success: true, data: finalState });
  } catch (error: any) {
    console.error("Scraper Agent Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
