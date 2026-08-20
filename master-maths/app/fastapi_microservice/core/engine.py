import random
import math
from datetime import datetime
from google import genai
from pydantic import BaseModel
import feedparser

class GARCHVolatility:
    def __init__(self):
        self.omega = 0.0001
        self.alpha = 0.05
        self.beta = 0.90
        self.volatility = 0.15

    def update(self, shock: float):
        """Stress-tested GARCH with caps"""
        self.volatility = math.sqrt(
            self.omega + self.alpha * shock**2 + self.beta * self.volatility**2
        )
        return min(0.65, max(0.08, self.volatility))  # Realistic bounds

class KalmanFilterVolatility:
    def __init__(self):
        self.estimate = 0.15
        self.error_covariance = 1.0
        self.process_noise = 0.01
        self.measurement_noise = 0.1
        
    def update(self, shock: float):
        p_predict = self.error_covariance + self.process_noise
        kalman_gain = p_predict / (p_predict + self.measurement_noise)
        self.estimate = self.estimate + kalman_gain * (shock - self.estimate)
        self.error_covariance = (1 - kalman_gain) * p_predict
        self.estimate = min(0.65, max(0.08, self.estimate))
        return self.estimate

class MADHATEvent(BaseModel):
    text: str
    speaker: str
    category: str
    context: str
    virality_score: float = 0.75

class MADHATFullEngine:
    def __init__(self, gemini_key: str):
        self.garch = GARCHVolatility()
        
        # We can dynamically initialize genai client as a mock if none provided
        try:
            self.gemini = genai.Client(api_key=gemini_key)
        except Exception:
            self.gemini = None

    def scrape_rss(self, urls: list):
        events = []
        for url in urls:
            try:
                feed = feedparser.parse(url)
                for entry in feed.entries[:6]:
                    events.append(MADHATEvent(
                        text = entry.title + " " + entry.get("description", "")[:200],
                        speaker = "Viral Entity",
                        category = "celebrities",
                        context = entry.get("description", ""),
                        virality_score = random.uniform(0.65, 0.96)
                    ))
            except Exception:
                continue
        return events

    async def analyze(self, event: MADHATEvent, roast_severity: int = 70, meme_humour: int = 65):
        # GARCH Stress Test
        shock = min(1.0, event.virality_score * 1.4)
        current_vol = self.garch.update(shock)

        lie_score = min(100.0, event.virality_score * 82 + random.uniform(5, 22))

        impact = {
            "projected_stock_move_pct": round(lie_score * current_vol * 0.021, 2),
            "ad_revenue_impact_m": round(lie_score * current_vol * 1.1, 1),
            "confidence": round(58 + lie_score * 0.32, 1)
        }

        # Roast with Throttles
        roast_prompt = self._build_roast_prompt(event, lie_score, roast_severity, meme_humour)
        try:
            if self.gemini:
                full_roast = self.gemini.models.generate_content(
                    model="gemini-2.5-flash", contents=roast_prompt
                ).text
            else:
                raise Exception("No client")
        except:
            intensity = "nuclear" if roast_severity > 75 else "savage"
            full_roast = f"High-severity {intensity} roast fallback activated. This completely imploded their credibility."

        markets = self._create_conviction_markets(event, impact, current_vol)

        return {
            "speaker": event.speaker,
            "lie_score": round(lie_score, 1),
            "garch_volatility": round(current_vol * 100, 2),
            "economic_impact": impact,
            "full_roast": full_roast,
            "markets": markets,
            "madconv_score": self._calculate_madconv(lie_score, current_vol)
        }

    def _build_roast_prompt(self, event, lie_score, severity: int, humour: int):
        intensity = "nuclear" if severity > 75 else "savage"
        humour_style = "maximum chaos" if humour > 70 else "balanced dark humour"
        return f"""Write a {intensity} satirical roast in South Park + Dave Chappelle + Onion style.
        Target: {event.speaker} - "{event.text[:160]}..."
        Lie Meter: {lie_score:.1f}/100. Use {humour_style}. Tie heavily to economic damage."""

    def _create_conviction_markets(self, event, impact, vol):
        return [
            {"type": "Continuous", "title": f"GARCH-Adjusted Volatility Impact — {event.speaker}", "expected": impact["projected_stock_move_pct"]},
            {"type": "OverUnder", "title": f"Ad Revenue Loss > ${impact['ad_revenue_impact_m']}M in 75 days?"},
            {"type": "Conviction_Saga", "title": f"Multi-Leg MADConv Saga: {event.speaker}", 
             "madconv": "t^1.35 × c^0.75 × d^1.45 × ψ^1.15 × (1+π^0.9) × liar_bonus × garch_amp"}
        ]

    def _calculate_madconv(self, lie_score, vol):
        return round(lie_score * (1 + vol) * 0.85, 1)
