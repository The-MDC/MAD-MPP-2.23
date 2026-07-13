export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!process.env.GOOGLE_API_KEY) {
      return Response.json({ reply: 'Conviction is strong. Stake your belief. How can I assist your gambit today?' });
    }
    // Real Gemini integration placeholder
    return Response.json({ reply: `Echoing your conviction: ${message}. The MAD Shield protects.` });
  } catch {
    return Response.json({ reply: 'MAD Gambit Concierge online. What market shall we predict?' });
  }
}