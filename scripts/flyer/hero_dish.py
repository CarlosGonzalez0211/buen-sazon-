#!/usr/bin/env python3
"""Hero-dish flyer: brand background, spotlight circle, dish cutout, headline, logo.
Output 1080x1296 JPEG (5:6), rendered at 2x. Colors follow content/brand/El-Buen-Sazon-brand-kit.md.

Variants decide where (and whether) a short line appears:
  none     headline + dish + logo only
  kicker   a small line above the headline
  footer   logo bottom-left, line bottom-right

  python scripts/flyer/hero_dish.py --dish tacos-alambre --headline "Tacos de alambre" --variant footer --line "Ven a disfrutarlos"
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "content" / "brand"
CUTOUTS = ROOT / "content" / "dishes-cutout"
W, H, S = 1080, 1296, 2  # post size, render scale

C = {"red": "#AC020B", "yellow": "#FACC17", "green": "#023C26", "white": "#FFFFFF"}

# brand kit "what goes on what": headline / body / rule colour, logo version, spotlight colour,
# and the sticker pill (fill, text) which must also be a readable pair from the kit's contrast table
THEMES = {
    "red": dict(head="yellow", body="white", rule="yellow", logo="El-Buen-Sazon-logo-white-outline.png", spot="white", pill=("yellow", "red")),
    "yellow": dict(head="red", body="green", rule="red", logo="El-Buen-Sazon-logo-nobg.png", spot="red", pill=("green", "yellow")),
    "green": dict(head="yellow", body="white", rule="yellow", logo="El-Buen-Sazon-logo-white-outline.png", spot="white", pill=("yellow", "green")),
    "white": dict(head="red", body="green", rule="red", logo="El-Buen-Sazon-logo-nobg.png", spot="green", pill=("red", "white")),
}
BACKGROUNDS = {
    "red-tonal": ("Red*tonal@2x.png", "red"),
    "green-tonal": ("Green*tonal@2x.png", "green"),
    "yellow-tonal": ("Yellow*tonal@2x.png", "yellow"),
    "white-red": ("White*red icons@2x.png", "white"),
    "white-green": ("White*green icons@2x.png", "white"),
    "white-yellow": ("White*yellow icons@2x.png", "white"),
    "solid-red": ("Solid*red@2x.png", "red"),
    "solid-green": ("Solid*green@2x.png", "green"),
    "solid-yellow": ("Solid*yellow@2x.png", "yellow"),
    "solid-white": ("Solid*white@2x.png", "white"),
}

# grammatical gender/number of each dish, so "Ven a disfrutarlos / -las / -lo / -la" agrees
DISH_FORM = {
    "tacos-alambre": "los", "tacos-deshebrada": "los", "chiles-rellenos": "los",
    "chilaquiles-montados": "los", "chilaquiles-sencillos": "los",
    "enchiladas-verdes": "las", "caldo-res-2": "lo", "caldo-ranchero": "lo",
    "club-sandwich": "lo", "platillo-mexicano": "lo", "tostada-deshebrada": "la",
}


def form(dish):
    return DISH_FORM.get(Path(dish).stem, "lo")


def font_display(px):
    return ImageFont.truetype(str(BRAND / "fonts" / "LilitaOne-Regular.ttf"), px)


def font_body(px):
    f = ImageFont.truetype(str(BRAND / "fonts" / "Nunito-Variable.ttf"), px)
    try:
        f.set_variation_by_axes([800])  # ExtraBold
    except Exception:
        pass
    return f


def wrap(draw, text, size, max_w):
    words = text.upper().split()
    for px in range(size, 79, -4):
        f = font_display(px)
        if draw.textlength(" ".join(words), font=f) <= max_w:
            return [" ".join(words)], f, px
        for i in range(1, len(words)):
            a, b = " ".join(words[:i]), " ".join(words[i:])
            if max(draw.textlength(a, font=f), draw.textlength(b, font=f)) <= max_w:
                return [a, b], f, px
    return [text.upper()], font_display(80), 80


def tracked(draw, xy, text, font, fill, tracking, anchor_center=True):
    """Letter-spaced text (Pillow has none built in)."""
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x, y = xy
    x = x - total / 2 if anchor_center else x
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill, anchor="ls")
        x += w + tracking


def render(dish, headline, bg, out, variant="none", line=""):
    pattern, theme_key = BACKGROUNDS[bg]
    t = THEMES[theme_key]
    if not line:
        variant = "none"
    canvas = Image.open(next(BRAND.joinpath("backgrounds").glob(pattern))).convert("RGBA").resize((W * S, H * S), Image.LANCZOS)
    d = ImageDraw.Draw(canvas)
    cxm = W * S / 2

    # kicker: small tracked line above the headline
    y = 64 * S
    if variant == "kicker":
        tracked(d, (cxm, y + 34 * S), line.upper(), font_body(34 * S), C[t["body"]], 6 * S)
        y += 58 * S

    # headline
    lines, fh, px = wrap(d, headline, 150 * S, 940 * S)
    for ln in lines:
        d.text((cxm, y), ln, font=fh, fill=C[t["head"]], anchor="ma")
        y += int(px * 0.98)
    y += 14 * S
    d.rectangle((cxm - 70 * S, y, cxm + 70 * S, y + 8 * S), fill=C[t["rule"]])
    head_bottom = y + 8 * S

    # logo: centered, or bottom-left in the footer variant
    logo = Image.open(BRAND / "logos" / t["logo"]).convert("RGBA")
    lw = (320 if variant == "footer" else 340) * S
    logo = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)
    logo_top = H * S - 44 * S - logo.height
    bottom_block = logo_top

    # spotlight circle + dish
    top = head_bottom + 36 * S
    avail = bottom_block - 28 * S - top
    dia = min(820 * S, avail)
    cx, cy = W * S // 2, top + avail // 2
    d.ellipse((cx - dia // 2, cy - dia // 2, cx + dia // 2, cy + dia // 2), fill=C[t["spot"]])

    src = CUTOUTS / f"{dish}.png"
    img = Image.open(src if src.exists() else Path(dish)).convert("RGBA")
    img = img.crop(img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
    k = min(990 * S / img.width, dia * 0.86 / img.height)
    img = img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS)
    px0, py0 = cx - img.width // 2, cy - img.height // 2 + int(dia * 0.04)
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 255))
    sh.putalpha(img.getchannel("A").point(lambda v: int(v * 0.38)))
    shadow.paste(sh, (px0, py0 + 16 * S), sh)
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18 * S)))
    canvas.alpha_composite(img, (px0, py0))

    if variant == "footer":
        canvas.alpha_composite(logo, (56 * S, logo_top))
        f = font_display(54 * S)
        words = line.upper().split()
        mid = (len(words) + 1) // 2
        for i, ln in enumerate([" ".join(words[:mid]), " ".join(words[mid:])]):
            if ln:
                d.text((W * S - 56 * S, logo_top + logo.height / 2 + (i - 0.5) * 60 * S), ln, font=f, fill=C[t["head"]], anchor="rm")
    else:
        canvas.alpha_composite(logo, (W * S // 2 - logo.width // 2, logo_top))

    final = canvas.convert("RGB").resize((W, H), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    final.save(out, "JPEG", quality=92, optimize=True)
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dish", required=True, help="cutout name (content/dishes-cutout/<name>.png) or a PNG path")
    ap.add_argument("--headline", required=True)
    ap.add_argument("--variant", default="none", choices=["none", "kicker", "footer"])
    ap.add_argument("--line", default="", help="the short line for sticker / kicker / footer")
    ap.add_argument("--bg", default="red-tonal", choices=sorted(BACKGROUNDS))
    ap.add_argument("--out")
    a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "content" / "flyer-samples" / f"{Path(a.dish).stem}-{a.bg}-{a.variant}.jpg"
    print(render(a.dish, a.headline, a.bg, out, a.variant, a.line))
