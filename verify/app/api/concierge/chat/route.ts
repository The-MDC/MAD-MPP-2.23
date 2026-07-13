import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.XAI_API_KEY;
  try {
    const { message } = await req.json();
    if (apiKey) {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'grok-4', messages: [{ role: 'system', content: 'You are the MAD Gambit Concierge — helpful, witty, conviction-focused.' }, { role: 'user', content: message }], temperature: 0.7 })
      });
      const data = await res.json();
      return NextResponse.json({ reply: data.choices?.[0]?.message?.content || 'Conviction received.' });
    }
  } catch {}
  return NextResponse.json({ reply: `🔥 Strong conviction detected: "${(req as any).json?.message || 'your play'}". Stake it. The MAD Gambit awaits.` });
}