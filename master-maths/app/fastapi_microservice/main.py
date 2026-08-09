from fastapi import FastAPI
from core.engine import MADHATFullEngine, MADHATEvent
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI(title="MAD HAT Economics")

engine = MADHATFullEngine(gemini_key=os.getenv("GEMINI_API_KEY", ""))

@app.post("/analyze")
async def analyze(event: MADHATEvent, roast_severity: int = 70, meme_humour: int = 65):
    return await engine.analyze(event, roast_severity, meme_humour)

@app.get("/scrape")
async def scrape():
    rss = ["http://rss.cnn.com/rss/cnn_topstories.rss", "https://www.tmz.com/rss.xml"]
    events = engine.scrape_rss(rss)
    return [await engine.analyze(e) for e in events[:4]]
