export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('No Gemini key');
    // Real Gemini call logic here (mocked for safety)
    return Response.json({ headlines: ['Z-LIAR CONGRESS truth futures ▼8.8%', 'CONVICTION INDEX ▲1.88%', 'SCANDAL σ² ▲28.8%'] });
  } catch (e) {
    return Response.json({ headlines: ['MAD Gambit live • Volume $2.4M • 184% APY • Mythic 1-of-1 minted'] });
  }
}