"""Background rotation: red leads (brand primary), no colour family twice in a row.

  next_background(history, kind, seed)  ->  background key for hero_dish / templates

`history` is the list of background keys of recent posts, newest last.
"""
import random

# family -> (share, [tonal / icon backgrounds], [solid backgrounds for text-heavy posts])
FAMILIES = {
    "red": (0.40, ["red-tonal"], ["solid-red"]),
    "yellow": (0.22, ["yellow-tonal"], ["solid-yellow"]),
    "green": (0.19, ["green-tonal"], ["solid-green"]),
    "white": (0.19, ["white-red", "white-green", "white-yellow"], ["solid-white"]),
}
# Posts with NO photo always use a pattern background: the pattern carries the brand, a flat solid looks empty.
NO_PHOTO = {"statement", "greeting", "poll", "tag", "ritual_text", "review", "announcement", "pun_final"}
# Posts that pair a lot of text with a dish photo read better on solid colour (brand kit: busy photos on solid).
TEXT_HEAVY_WITH_DISH = {"lettering", "pun", "anatomy"}


def family_of(bg):
    for fam, (_, tonal, solid) in FAMILIES.items():
        if bg in tonal or bg in solid:
            return fam
    return None


def next_background(history, kind="hero", seed=None):
    rng = random.Random(seed)
    last = [family_of(b) for b in history[-2:]]
    # never repeat the previous family; otherwise draw by share, so red leads
    allowed = [f for f in FAMILIES if f != (last[-1] if last else None)]
    fam = rng.choices(allowed, weights=[FAMILIES[f][0] for f in allowed])[0]
    _, tonal, solid = FAMILIES[fam]
    pool = solid if kind in TEXT_HEAVY_WITH_DISH else tonal  # NO_PHOTO and hero posts: pattern
    # white icon variants rotate so the white posts differ from each other too
    used = [b for b in history if b in pool]
    choices = [b for b in pool if b not in used[-2:]] or pool
    return rng.choice(choices)


if __name__ == "__main__":
    hist, kinds = [], ["hero", "lettering", "hero", "pun", "hero", "anatomy", "hero", "review", "hero", "hero", "lettering", "hero"] * 4
    counts = {}
    for i, k in enumerate(kinds):
        bg = next_background(hist, k, seed=i)
        hist.append(bg)
        counts[family_of(bg)] = counts.get(family_of(bg), 0) + 1
    print(" ".join(hist[:12]))
    print({f: f"{round(100 * n / len(kinds))}%" for f, n in counts.items()})
