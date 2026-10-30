#!/usr/bin/env python3
"""Publishes the rendered library (v2_batch.py output in content/flyer-samples/v2/) as the post library:
public/social/<name>-<tag>.jpg plus content/flyers.json, which tells the draft generator which images belong to
which caption and which colour family each flyer is. A new tag gives new URLs, so Telegram, Instagram and Vercel
never serve a cached older version and drafts that already point at an old file keep working.
Captions still waiting on the owner (status needs_input) are not part of the library.
  python scripts/flyer/export_library.py v2"""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "content" / "flyer-samples" / "v2"
SOCIAL = ROOT / "public" / "social"
tag = sys.argv[1] if len(sys.argv) > 1 else "v2"

captions = {c["id"]: c for c in json.load(open(ROOT / "content" / "captions.json", encoding="utf8"))["captions"]}
index = json.load(open(SRC / "index.json", encoding="utf8"))

library = {}
for cid, entry in index.items():
    if captions[cid]["status"] != "ready":
        continue
    files = []
    for rel in entry["images"]:
        stem = Path(rel).stem
        dest = f"{stem}-{tag}.jpg"
        shutil.copyfile(SRC / f"{stem}.jpg", SOCIAL / dest)
        files.append(f"social/{dest}")
    library[cid] = {"images": files, "family": entry["family"]}

json.dump(library, open(ROOT / "content" / "flyers.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
missing = [c for c, v in captions.items() if v["status"] == "ready" and c not in library]
print(len(library), "exported; ready captions without a flyer:", missing)
