import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.XAI_API_KEY;
  try {
    if (apiKey) {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'grok-4',
          messages: [{ role: 'system', content: 'You are a witty satirical market ticker for MAD Gambit.' }, { role: 'user', content: 'Generate 5 live satirical headlines' }],
          temperature: 0.9
        })
      });
      const data = await res.json();
      return NextResponse.json({ headlines: data.choices?.[0]?.message?.content.split('\n') || [] });
    }
  } catch (e) {
    console.warn('Grok satire fallback triggered');
  }
  // Rich mock fallback
  return NextResponse.json({ headlines: [
    '📰 Z-LIAR CONGRESS truth futures ▼ 8.8% — witnesses sworn, needle unimpressed',
    '🔥 CONVICTION INDEX ▲ 1.88% — belief is the new oil',
    '💥 SCANDAL σ² ▲ 28.8% — volatility lawyered up',
    '🎰 $MADx supply locked at 888,888,888 — luck engineered',
    '🛡️ MAD Shield TVL $47M — degen tears fully insured'
  ] });
}