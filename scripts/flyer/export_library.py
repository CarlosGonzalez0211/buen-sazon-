#!/usr/bin/env python3
"""Publishes the approved flyers (the SPECS in preview_batch.py, already rendered) as the post library:
public/social/<caption-id>.jpg (carousel slides: <caption-id>-1.jpg ...) plus content/flyers.json, which tells
the draft generator which images belong to which caption and which colour family each flyer is.
Run preview_batch.py first. Captions still waiting on the owner (status needs_input) are not exported."""
import json
import re
import shutil
from collections import defaultdict
from pathlib import Path
from PIL import Image
import preview_batch as P

ROOT = Path(__file__).resolve().parents[2]
SOCIAL = ROOT / "public" / "social"
SOCIAL.mkdir(parents=True, exist_ok=True)
captions = {c["id"]: c for c in json.load(open(ROOT / "content" / "captions.json", encoding="utf8"))["captions"]}

slides = defaultdict(list)  # caption id -> [(n, label)]
for n, (cid, label, _) in enumerate(P.SPECS, 1):
    slides[cid].append((n, label))

library = {}
for cid, items in slides.items():
    if captions[cid]["status"] != "ready":
        continue
    m = re.search(r"red|green|yellow|white", items[0][1])
    family = m.group(0) if m else "mixed"  # polls use patterned halves in two colours
    files = []
    for k, (n, _) in enumerate(items, 1):
        name = f"{cid}.jpg" if len(items) == 1 else f"{cid}-{k}.jpg"
        src = P.OUT / "batch" / f"n{n:02d}.jpg"
        im = Image.open(src).convert("RGB")
        assert im.size == (1080, 1296), (src, im.size)
        im.save(SOCIAL / name, "JPEG", quality=90, optimize=True)
        files.append(f"social/{name}")
    library[cid] = {"images": files, "family": family}

json.dump(library, open(ROOT / "content" / "flyers.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
missing = [c for c, v in captions.items() if v["status"] == "ready" and c not in library]
print(len(library), "exported; ready captions without a flyer:", missing)
