import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import Parser from "rss-parser";

const parser = new Parser();

const RSS_FEEDS = [
    "https://www.tmz.com/rss.xml",
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss"
];

export async function GET(req: NextRequest) {
    try {
        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json({ error: "Missing GOOGLE_API_KEY" }, { status: 500 });
        }

        // 1. Fetch Headlines
        let headlines: string[] = [];
        for (const feedUrl of RSS_FEEDS) {
            try {
                const feed = await parser.parseURL(feedUrl);
                const topItems = feed.items.slice(0, 3).map(item => item.title || "");
                headlines.push(...topItems);
            } catch (err) {
                console.warn(`Failed to fetch RSS: ${feedUrl}`);
            }
        }

        if (headlines.length === 0) {
            return NextResponse.json({ error: "No headlines fetched" }, { status: 500 });
        }

        // 2. Generate Satire & Scandal Velocity via Gemini
        const llm = new ChatGoogleGenerativeAI({
            model: "gemini-flash-latest",
            temperature: 0.9,
            maxOutputTokens: 500,
        });

        const prompt = `You are the MAD Gambit Satire Engine.
Analyze the following recent headlines from tabloids and crypto news.
Select the most ridiculous, controversial, or viral headline from the list.
Then, generate a JSON response with exactly this structure:
{
  "headline": "The original headline",
  "satire_take": "A cynical, MAD Magazine x South Park style satirical take on this news (1-2 sentences).",
  "scandal_velocity": <a number between 1.0 and 100.0 representing how fast this drama is spreading>,
  "z_liar_index": <a number between 1.0 and 100.0 representing how much BS is in the headline>
}
Ensure the output is strictly valid JSON without markdown wrapping.

Headlines:
${headlines.join("\n")}
`;

        const result = await llm.invoke([
            new SystemMessage("You are an analytical JSON generating bot."),
            new HumanMessage(prompt)
        ]);

        let jsonText = result.content.toString();
        // Strip markdown if present
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/^```json\n?/, "").replace(/```$/, "").trim();
        }

        const data = JSON.parse(jsonText);
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Satire Engine Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
