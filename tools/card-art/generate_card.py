"""
MAD Gambit card-art generator — FLUX + Pixar LoRA.

Absorbed from the MADdegen/MAD-Card-Art-Generator prototype and rebuilt on the platform's canon:

  * factions are the app's canonical on-chain ids (see faction_prompts.json), not the prototype's own list
  * ARCHETYPES ONLY. No real person's name or likeness, ever. This is the same rule the Z-Liar Meter follows (it prices
    a claim, never a speaker) and it is enforced here in code, not just in the README
  * every image gets a sidecar JSON (faction, rarity, prompt, model, seed) so a minted card can always be traced

Needs a GPU for any real speed. It is a tool, not part of the web app: nothing in verify/ imports it.

    pip install diffusers torch transformers accelerate
    python generate_card.py --faction disruptors --rarity Rare \
        --prompt "a founder in a hoodie with a unicorn horn growing from their head"
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).parent
FACTIONS = json.loads((HERE / "faction_prompts.json").read_text(encoding="utf-8"))
FACTIONS.pop("_note", None)

# Matches the app's RARITY_TABLE order (Common → Mythic). Higher rarity, richer frame.
RARITY_FRAME = {
    "Common": "plain steel frame",
    "Uncommon": "bronze frame",
    "Rare": "silver foil frame",
    "Epic": "purple holographic frame",
    "Legendary": "gold foil frame with engraved filigree",
    "Golden Hand": "molten gold frame, a gilded hand at the corner",
    "Mythic": "one-of-one obsidian and gold frame, impossible to reproduce",
}

NEGATIVE = (
    "realistic photo, photograph, a real person, celebrity likeness, recognisable face, text, watermark, logo, "
    "blurry, low quality, nsfw, violence, gore, deformed"
)

# A prompt that reads like it names someone is refused. Crude on purpose: a false refusal costs one rewrite,
# a false pass costs a likeness. Prompts describe a ROLE ("a founder", "a politician"), never a person.
_NAMELIKE = re.compile(r"\b[A-Z][a-z]{2,}\s+(?:[A-Z]\.\s+)?[A-Z][a-z]{2,}\b")
_LIKENESS = re.compile(r"\b(looks? like|resembl\w+|in the likeness of|based on (?:the )?(?:real|actual)|real (?:person|politician|celebrity))\b", re.I)


def is_archetype_only(prompt: str) -> bool:
    return not (_NAMELIKE.search(prompt) or _LIKENESS.search(prompt))


def build_prompt(prompt: str, faction: str, rarity: str) -> str:
    if faction not in FACTIONS:
        raise SystemExit(f"unknown faction '{faction}'. Use one of: {', '.join(FACTIONS)}")
    if rarity not in RARITY_FRAME:
        raise SystemExit(f"unknown rarity '{rarity}'. Use one of: {', '.join(RARITY_FRAME)}")
    if not is_archetype_only(prompt):
        raise SystemExit("refused: describe a role or archetype (\"a founder\", \"a politician\"), not a named or recognisable person")
    return (
        f"pixar, satirical character portrait, {prompt}, {FACTIONS[faction]['style']}, "
        f"exaggerated features, oversized head, dramatic lighting, dark background #0A0A0F, "
        f"trading card, {RARITY_FRAME[rarity]}, high quality, detailed, 4k"
    )


def generate(prompt: str, faction: str, rarity: str, out_dir: Path, seed: int | None = None) -> Path:
    full = build_prompt(prompt, faction, rarity)
    import torch
    from diffusers import DiffusionPipeline

    out_dir.mkdir(parents=True, exist_ok=True)
    pipe = DiffusionPipeline.from_pretrained("black-forest-labs/FLUX.1-dev", torch_dtype=torch.bfloat16)
    pipe.load_lora_weights("prithivMLmods/Canopus-Pixar-3D-FluxDev-LoRA")
    pipe.to("cuda" if torch.cuda.is_available() else "cpu")

    gen = torch.Generator().manual_seed(seed if seed is not None else int(datetime.now().timestamp()))
    image = pipe(prompt=full, negative_prompt=NEGATIVE, num_inference_steps=30, guidance_scale=7.5,
                 width=832, height=1216, generator=gen).images[0]

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    png = out_dir / f"{faction}_{rarity.replace(' ', '')}_{stamp}.png"
    image.save(png)
    png.with_suffix(".json").write_text(json.dumps({
        "faction": faction, "faction_display": FACTIONS[faction]["display"], "rarity": rarity,
        "prompt": full, "negative_prompt": NEGATIVE, "model": "FLUX.1-dev + Canopus-Pixar-3D LoRA",
        "seed": int(gen.initial_seed()), "generated_at": stamp, "depicts_real_person": False,
    }, indent=2), encoding="utf-8")
    return png


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--faction", required=True, choices=sorted(FACTIONS))
    ap.add_argument("--rarity", default="Common", choices=list(RARITY_FRAME))
    ap.add_argument("--out", default="output")
    ap.add_argument("--seed", type=int)
    a = ap.parse_args()
    print(generate(a.prompt, a.faction, a.rarity, Path(a.out), a.seed))
