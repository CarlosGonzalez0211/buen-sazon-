#!/usr/bin/env python3
"""Style experiments from the owner's references: font pairings and photo-led posts.
Candidate fonts live in content/brand/fonts/candidates/ until one is chosen."""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import templates as T
from hero_dish import BRAND, C, H, ROOT, S, THEMES, W, font_display, BACKGROUNDS

CAND = BRAND / "fonts" / "candidates"
FONTS = {
    "lilita": BRAND / "fonts" / "LilitaOne-Regular.ttf",
    "anton": CAND / "Anton-Regular.ttf",
    "bebas": CAND / "BebasNeue-Regular.ttf",
    "yellowtail": CAND / "Yellowtail-Regular.ttf",
    "kaushan": CAND / "KaushanScript-Regular.ttf",
    "caveat": CAND / "CaveatBrush-Regular.ttf",
}
SRC_PHOTOS = ROOT / "public" / "dishes"


def F(key, px):
    return ImageFont.truetype(str(FONTS[key]), px)


def fit(d, text, key, start, max_w):
    px = start
    while px > 40 and d.textlength(text, font=F(key, px * S)) > max_w * S:
        px -= 4
    return px


def script_layer(text, key, px, fill, angle=0, shadow=True):
    f = F(key, px * S)
    tmp = ImageDraw.Draw(Image.new("L", (1, 1)))
    w = int(tmp.textlength(text, font=f)) + 40 * S
    h = int(px * S * 1.7)
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    if shadow:
        ld.text((22 * S, int(h * 0.62) + 4 * S), text, font=f, fill=(0, 0, 0, 90), anchor="ls")
    ld.text((20 * S, int(h * 0.62)), text, font=f, fill=fill, anchor="ls")
    return lay.rotate(angle, resample=Image.BICUBIC, expand=True)


def sticker_v2(dish, line1, line2, script, bg, name, disp, scr, tilt=-6):
    canvas, d, t = T.base(bg)
    x0 = 70 * S
    s1 = fit(d, line1.upper(), disp, 110, W - 140)
    s2 = fit(d, line2.upper(), disp, 300 if disp != "lilita" else 190, W - 140)
    base_y = 345 * S
    d.text((x0, base_y), line1.upper(), font=F(disp, s1 * S), fill=C[t["head"]], anchor="ls")
    d.text((x0, base_y + int(s2 * S * 0.98)), line2.upper(), font=F(disp, s2 * S), fill=C["white"] if t["head"] != "red" else C["red"], anchor="ls")
    lg = Image.open(BRAND / "logos" / t["logo"]).convert("RGBA")
    lg = lg.resize((230 * S, int(lg.height * 230 * S / lg.width)), Image.LANCZOS)
    canvas.alpha_composite(lg, (x0, 56 * S))

    img = T.cutout(dish, width=1050)
    st = T.die_cut(img, 22 * S).rotate(tilt, resample=Image.BICUBIC, expand=True)
    px, py = W * S - st.width + 150 * S, 640 * S
    sh = Image.new("RGBA", st.size, (0, 0, 0, 255)); sh.putalpha(st.getchannel("A").point(lambda v: int(v * 0.35)))
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0)); layer.paste(sh, (px + 6 * S, py + 20 * S), sh)
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(16 * S)))
    l2 = Image.new("RGBA", canvas.size, (0, 0, 0, 0)); l2.paste(st, (px, py), st)
    canvas.alpha_composite(l2)

    sl = script_layer(script, scr, 120, C[t["rule"]], angle=4)
    canvas.alpha_composite(sl, (x0 - 10 * S, base_y + int(s2 * S * 0.98) - 20 * S))
    d = ImageDraw.Draw(canvas)
    for (fx, fy, r) in ((0.90, 0.30, 40), (0.95, 0.40, 20), (0.10, 0.62, 26)):
        T.sparkle(d, int(W * S * fx), int(H * S * fy), r * S, C[t["rule"]])
    return T.save(canvas, name)


def arrow(d, p0, p1, bend, col, width):
    """Curved hand-drawn-style arrow from p0 to p1; bend shifts the control point."""
    cx, cy = (p0[0] + p1[0]) / 2 + bend[0], (p0[1] + p1[1]) / 2 + bend[1]
    pts = [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * cx + t * t * p1[0],
            (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * cy + t * t * p1[1]) for t in [i / 24 for i in range(25)]]
    d.line(pts, fill=col, width=width, joint="curve")
    a = math.atan2(pts[-1][1] - pts[-4][1], pts[-1][0] - pts[-4][0])
    L = 34 * S
    d.line([pts[-1], (pts[-1][0] - L * math.cos(a - 0.5), pts[-1][1] - L * math.sin(a - 0.5))], fill=col, width=width)
    d.line([pts[-1], (pts[-1][0] - L * math.cos(a + 0.5), pts[-1][1] - L * math.sin(a + 0.5))], fill=col, width=width)


def photo_post(photo, script, headline, bg, name, disp, scr, photo_h=760, focus=(0.5, 0.5), notes=None):
    """Top: patterned panel with the headline. Bottom: a real photo bleeding to the edges, with optional hand-drawn notes.
    notes = [(text, (tx, ty) target as fraction of the photo, (lx, ly) label position as fraction of the photo, bend)]"""
    canvas, d, t = T.base(bg)
    ph = photo_h * S
    img = Image.open(SRC_PHOTOS / f"{photo}.jpg").convert("RGB")
    k = max(W * S / img.width, ph / img.height)
    img = img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS)
    ox = int((img.width - W * S) * focus[0]); oy = int((img.height - ph) * focus[1])
    img = img.crop((ox, oy, ox + W * S, oy + ph))
    top = H * S - ph
    canvas.paste(img, (0, top))
    d = ImageDraw.Draw(canvas)
    # headline in the panel, left aligned
    x0 = 70 * S
    lg = Image.open(BRAND / "logos" / t["logo"]).convert("RGBA")
    lg = lg.resize((220 * S, int(lg.height * 220 * S / lg.width)), Image.LANCZOS)
    canvas.alpha_composite(lg, (x0, 50 * S))
    s2 = fit(d, headline.upper(), disp, 250 if disp != "lilita" else 170, W - 140)
    base_y = top - 40 * S
    d.text((x0, base_y), headline.upper(), font=F(disp, s2 * S), fill=C["white"] if t["head"] != "red" else C["red"], anchor="ls")
    sl = script_layer(script, scr, 118, C[t["rule"]], angle=3)
    cap = int(s2 * S * (0.70 if disp == "lilita" else 0.76))
    script_base = base_y - cap - 22 * S
    canvas.alpha_composite(sl, (x0 - 10 * S, script_base - int(sl.height * 0.62)))
    # notes over the photo
    if notes:
        d = ImageDraw.Draw(canvas)
        for text, tgt, lab, bend in notes:
            tx, ty = int(tgt[0] * W * S), top + int(tgt[1] * ph)
            lx, ly = int(lab[0] * W * S), top + int(lab[1] * ph)
            nl = script_layer(text, scr, 78, (255, 255, 255, 255), angle=0)
            lx = min(lx, W * S - nl.width + 10 * S)
            canvas.alpha_composite(nl, (lx - 20 * S, ly - int(nl.height * 0.62)))
            tw = d.textlength(text, font=F(scr, 78 * S))
            start = (lx + tw / 2 if tw else lx, ly + 24 * S)
            arrow(d, start, (tx, ty), (bend[0] * S, bend[1] * S), (255, 255, 255, 255), 5 * S)
    return T.save(canvas, name)


def render_photo_samples():
    ps = [
        photo_post("desayuno deluxe 1", "Buenos días", "Desayuno deluxe", "red-tonal", "ph1", "anton", "yellowtail", photo_h=700),
        photo_post("tacos alambre 1", "Nuevo antojo", "Tacos de alambre", "green-tonal", "ph2", "bebas", "kaushan", photo_h=640,
                   notes=[("aguacate", (0.19, 0.58), (0.04, 0.10), (30, 40)), ("papa al horno", (0.66, 0.30), (0.50, 0.07), (-40, 30)),
                          ("carne y queso", (0.55, 0.62), (0.40, 0.90), (-30, -30))]),
        photo_post("mesa servida 1", "Para compartir", "La mesa está puesta", "yellow-tonal", "ph3", "anton", "caveat", photo_h=700),
    ]
    sheet = Image.new("RGB", (3 * 540, 648), (30, 30, 30))
    for i, p in enumerate(ps):
        sheet.paste(Image.open(p).resize((540, 648), Image.LANCZOS), (i * 540, 0))
    sheet.save(T.OUT / "_photo_posts.jpg", quality=90)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "photos":
        render_photo_samples(); sys.exit()
    combos = [("lilita", "yellowtail"), ("anton", "yellowtail"), ("bebas", "kaushan"),
              ("anton", "caveat"), ("lilita", "kaushan"), ("bebas", "caveat")]
    sheet = Image.new("RGB", (6 * 360, 432 + 432), (30, 30, 30))
    for i, (a, b) in enumerate(combos):
        p = sticker_v2("chilaquiles-montados", "Hoy toca", "chilaquiles", "se antoja", "red-tonal", f"font-{a}-{b}", a, b)
        sheet.paste(Image.open(p).resize((360, 432), Image.LANCZOS), (i * 360, 0))
    ps = [
        photo_post("desayuno deluxe 1".replace(" 1", " 1"), "Buenos días", "Desayuno deluxe", "red-tonal", "ph1", "anton", "yellowtail", photo_h=720),
        photo_post("tacos alambre 1", "Nuevo antojo", "Tacos de alambre", "green-tonal", "ph2", "bebas", "kaushan", photo_h=640,
                   notes=[("aguacate", (0.19, 0.58), (0.05, 0.12), (30, 40)), ("papa al horno", (0.66, 0.30), (0.52, 0.10), (-40, 30)),
                          ("carne y queso", (0.55, 0.62), (0.60, 0.88), (-30, -30))]),
        photo_post("mesa servida 1", "Para compartir", "La mesa está puesta", "yellow-tonal", "ph3", "anton", "caveat", photo_h=700),
    ]
    for i, p in enumerate(ps):
        sheet.paste(Image.open(p).resize((360, 432), Image.LANCZOS), (i * 360, 432))
    sheet.save(T.OUT / "_style_lab.jpg", quality=90)
    print("ok")
