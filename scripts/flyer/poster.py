#!/usr/bin/env python3
"""Overlap poster (v2): huge stacked type, same size on every row, and the plate sits on top of it, hiding part
of the letters. The plate's cast shadow is multiplied onto the type and background (a darker, tinted version of
what is underneath), like the reference posters. One dominant colour per post, small logo, one tiny line.

The plate position is searched automatically: every row must stay readable (its first letter fully visible and
most of its ink uncovered) while at least one row is clearly overlapped."""
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
import templates as T
from hero_dish import BRAND, H, S, W

FONT = BRAND / "fonts" / "LilitaOne-Regular.ttf"
BODY = BRAND / "fonts" / "Nunito-Variable.ttf"
OUT = T.OUT / "v2"

# type colour, small-text colour, accent, and the multiply tint of the plate's cast shadow (per RGB channel, 1 = no change)
SCHEMES = {
    "red": dict(type="#FFFFFF", small="#FFFFFF", accent="#FACC17", tint=(0.80, 0.36, 0.36)),
    "green": dict(type="#FACC17", small="#FFFFFF", accent="#FFFFFF", tint=(0.52, 0.74, 0.58)),
    "yellow": dict(type="#AC020B", small="#023C26", accent="#023C26", tint=(0.84, 0.58, 0.36)),
    "white": dict(type="#AC020B", small="#023C26", accent="#023C26", tint=(0.84, 0.80, 0.72)),
}
BG_FAMILY = {"red-tonal": "red", "green-tonal": "green", "yellow-tonal": "yellow", "white-red": "white", "white-green": "white", "white-yellow": "white"}
GRAIN = 4.0  # film grain, in 8-bit levels at 2x; keeps flat colour from looking digital


def lil(px):
    return ImageFont.truetype(str(FONT), int(px))


def nun(px):
    f = ImageFont.truetype(str(BODY), int(px))
    try:
        f.set_variation_by_axes([800])
    except Exception:
        pass
    return f


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def finish_plate(img):
    """Gentle food-photo punch plus a clean 1px-eroded edge so no halo from the cutout shows on colour."""
    rgb, a = img.convert("RGB"), img.getchannel("A")
    rgb = ImageEnhance.Contrast(rgb).enhance(1.06)
    rgb = ImageEnhance.Color(rgb).enhance(1.08)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.25)
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = rgb.convert("RGBA")
    out.putalpha(a)
    return out


def layout_type(rows, avail_h, max_w):
    """One font size for all rows: the largest that fits the width of the widest row and the height of the stack.
    Rows with accents or an inverted mark get more leading so the marks do not touch the row above."""
    gf = 0.32 if any(ch in "ÁÉÍÓÚÑ¿" for r in rows for ch in r) else 0.17
    best = 40 * S
    for px in range(40 * S, 520 * S, 4):
        f = lil(px)
        wmax = max(f.getbbox(r)[2] - f.getbbox(r)[0] for r in rows)
        cap = f.getbbox("H")[3] - f.getbbox("H")[1]
        if wmax > max_w or len(rows) * cap + (len(rows) - 1) * gf * cap > avail_h:
            break
        best = px
    f = lil(best)
    cap = f.getbbox("H")[3] - f.getbbox("H")[1]
    return f, cap, int(gf * cap)


def poster(dish, rows, bg, name, sub=None, dish_w=1120, tilt=-6, type_top=None, min_visible=0.66, plate_bottom=64, swipe=False):
    fam = BG_FAMILY[bg]
    sc = SCHEMES[fam]
    canvas, d, t = T.base(bg)
    rows = [r.upper() for r in rows]
    x0, maxw = 62 * S, (W - 124) * S
    type_top = type_top or (222 if sub or swipe else 196)  # a small line above the type when there is one

    # plate first: its size decides how much room the type gets
    img = finish_plate(T.cutout(dish, width=dish_w))
    img = img.rotate(tilt, resample=Image.BICUBIC, expand=True)
    pw, ph = img.size
    bottom = (H - plate_bottom) * S
    type_h = bottom - int(0.92 * ph) - type_top * S  # the plate is the star: the type gets what is left above it, and the plate rises over its last row
    f, cap, gap = layout_type(rows, type_h, maxw)

    # type: one mask per row (to measure what the plate hides) and the drawn rows
    base_y = type_top * S + cap
    masks, boxes = [], []
    for i, r in enumerate(rows):
        l, tt, rr, b = f.getbbox(r)
        y = base_y + i * (cap + gap)
        m = Image.new("L", (W * S, H * S), 0)
        ImageDraw.Draw(m).text((x0 - l, y), r, font=f, fill=255, anchor="ls")
        masks.append(np.array(m) > 128)
        boxes.append((x0, y - cap, x0 + (rr - l), y))
        d.text((x0 - l, y), r, font=f, fill=sc["type"], anchor="ls")
    type_bottom = boxes[-1][3]

    # search the plate position (at quarter resolution): prefer a big overlap, keep every row readable
    q = 4
    qm = [np.array(Image.fromarray(m.astype(np.uint8) * 255).resize((W * S // q, H * S // q))) > 128 for m in masks]
    qa = np.array(img.getchannel("A").resize((pw // q, ph // q))) > 128
    qh, qw = qa.shape
    best = None
    stats = {}
    for rise in range(0, 140 * S, 16):
        for dx in range(0, 760 * S, 16):
            px0 = -int(0.05 * pw) + dx
            py0 = bottom - ph - rise
            if px0 + pw > W * S + int(0.16 * pw) or py0 + ph > H * S - 40 * S:
                continue
            x, y = px0 // q, py0 // q
            pa = np.zeros((H * S // q, W * S // q), bool)
            ys, xs = slice(max(y, 0), min(y + qh, pa.shape[0])), slice(max(x, 0), min(x + qw, pa.shape[1]))
            pa[ys, xs] = qa[ys.start - y: ys.stop - y, xs.start - x: xs.stop - x]
            vis = [1 - (pa & m).sum() / max(m.sum(), 1) for m in qm]
            first_ok = all(not pa[b[1] // q: b[3] // q, b[0] // q: (b[0] + int((b[3] - b[1]) * 0.55)) // q].any() for b in boxes)
            overlap = max(1 - v for v in vis)
            stats[(min(vis) >= min_visible, first_ok, overlap >= 0.10)] = stats.get((min(vis) >= min_visible, first_ok, overlap >= 0.10), 0) + 1
            if min(vis) < min_visible or not first_ok or overlap < 0.10:
                continue
            score = abs(overlap - 0.24) * 100 + dx * 0.004 + rise * 0.01  # about a quarter of the busiest row hidden: clearly overlapped, still readable; keep the plate low
            if best is None or score < best[0]:
                best = (score, px0, py0)
    if best is None:
        # smaller plate first, then a slightly looser readability rule
        if dish_w > 800:
            return poster(dish, rows, bg, name, sub, dish_w - 40, tilt, type_top, min_visible, plate_bottom, swipe)
        if min_visible > 0.5:
            return poster(dish, rows, bg, name, sub, 1120, tilt, type_top, min_visible - 0.04, plate_bottom, swipe)
        raise RuntimeError(f"no plate position keeps {name} readable: {stats}")
    else:
        _, px0, py0 = best
        print('  ', name, 'dish_w', dish_w, 'min_visible', min_visible, 'plate', px0 // S, py0 // S, pw // S, ph // S, 'type_bottom', type_bottom // S, 'score', round(best[0], 2))

    # cast shadow multiplied onto everything underneath, then a tight contact shadow, then the plate
    arr = np.array(canvas.convert("RGB")).astype(np.float32)
    sh = Image.new("L", canvas.size, 0)
    sh.paste(img.getchannel("A"), (px0 + 62 * S, py0 + 78 * S))
    a = np.array(sh.filter(ImageFilter.GaussianBlur(7 * S))).astype(np.float32)[..., None] / 255 * 0.92
    k = np.array(sc["tint"], np.float32)[None, None, :]
    arr = arr * (1 - a * (1 - k))
    canvas = Image.fromarray(arr.clip(0, 255).astype(np.uint8)).convert("RGBA")
    contact = Image.new("L", canvas.size, 0)
    contact.paste(img.getchannel("A"), (px0 + 6 * S, py0 + 16 * S))
    contact = contact.filter(ImageFilter.GaussianBlur(10 * S)).point(lambda v: int(v * 0.40))
    canvas.alpha_composite(Image.merge("RGBA", (*Image.new("RGB", canvas.size, (0, 0, 0)).split(), contact)))
    lay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    lay.paste(img, (px0, py0), img)
    canvas.alpha_composite(lay)

    lg = Image.open(BRAND / "logos" / t["logo"]).convert("RGBA")
    lg = lg.resize((200 * S, int(lg.height * 200 * S / lg.width)), Image.LANCZOS)
    canvas.alpha_composite(lg, (W * S - 56 * S - lg.width, 52 * S))
    top_line(canvas, sc, x0, sub, swipe)
    return save_final(canvas, name)


def top_line(canvas, sc, x0, sub=None, swipe=False):
    """Small line above the type (the plate owns the bottom): the line on the left, DESLIZA on the right."""
    d = ImageDraw.Draw(canvas)
    if sub:
        d.text((x0, 190 * S), sub.upper(), font=nun(34 * S), fill=sc['small'], anchor='ls')
    if swipe:
        d.text((W * S - 130 * S, 190 * S), 'DESLIZA', font=nun(34 * S), fill=sc['small'], anchor='rs')
        T.arrow(d, W * S - 56 * S, 178 * S, 20 * S, sc['small'])


def footer(canvas, sc, x0, sub=None, swipe=False):
    d = ImageDraw.Draw(canvas)
    if sub:
        d.text((x0, (H - 62) * S), sub.upper(), font=nun(36 * S), fill=sc["small"], anchor="ls")
    if swipe:
        d.text((W * S - 130 * S, (H - 62) * S), "DESLIZA", font=nun(34 * S), fill=sc["small"], anchor="rs")
        T.arrow(d, W * S - 56 * S, (H - 74) * S, 20 * S, sc["small"])


def save_final(canvas, name):
    """Grain on the whole piece, then save at full quality (4:4:4 chroma, q95)."""
    rgb = np.array(canvas.convert("RGB")).astype(np.float32)
    rgb += np.random.default_rng(7).normal(0, GRAIN, rgb.shape[:2])[..., None]
    final = Image.fromarray(rgb.clip(0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / f"{name}.jpg"
    final.save(p, "JPEG", quality=95, subsampling=0, optimize=True)
    return p


def typeonly(rows, bg, name, accent=None, sub=None, big_logo=False, swipe=False):
    """No-photo poster in the same language: huge stacked rows of one size, one accent row, the block centred
    a little above the middle so the small line and logo have room."""
    fam = BG_FAMILY[bg]
    sc = SCHEMES[fam]
    canvas, d, t = T.base(bg)
    rows = [r.upper() for r in rows]
    x0, maxw = 62 * S, (W - 124) * S
    f, cap, gap = layout_type(rows, (H - 200 - 210) * S, maxw)
    total = len(rows) * cap + (len(rows) - 1) * gap
    y = max(190 * S, int((H * S - total) * 0.44)) + cap
    for i, r in enumerate(rows):
        l = f.getbbox(r)[0]
        d.text((x0 - l, y), r, font=f, fill=sc["accent"] if i == accent else sc["type"], anchor="ls")
        y += cap + gap
    lg = Image.open(BRAND / "logos" / t["logo"]).convert("RGBA")
    if big_logo:
        lg = lg.resize((380 * S, int(lg.height * 380 * S / lg.width)), Image.LANCZOS)
        canvas.alpha_composite(lg, (x0, H * S - 110 * S - lg.height))
    else:
        lg = lg.resize((200 * S, int(lg.height * 200 * S / lg.width)), Image.LANCZOS)
        canvas.alpha_composite(lg, (W * S - 56 * S - lg.width, 52 * S))
    footer(canvas, sc, x0, None if big_logo else sub, swipe)
    return save_final(canvas, name)


if __name__ == "__main__":
    specs = [
        ("tacos-alambre", ["Tacos", "de", "alam", "bre"], "red-tonal", "v1", None),
        ("chilaquiles-montados", ["Hoy", "toca", "chila", "quiles"], "red-tonal", "v2", "Ven a disfrutarlos"),
        ("caldo-ranchero", ["Caldo", "ran", "chero"], "green-tonal", "v3", None),
        ("caldo-res-2", ["Martes", "de", "caldo"], "yellow-tonal", "v4", "¿Con limón o sin limón?"),
        ("chiles-rellenos", ["Chiles", "relle", "nos"], "white-red", "v5", None),
        ("enchiladas-verdes", ["Enchi", "ladas", "ver", "des"], "yellow-tonal", "v6", None),
    ]
    files = [poster(*s[:4], sub=s[4]) for s in specs]
    sheet = Image.new("RGB", (3 * 540 + 20, 2 * 648 + 10), (24, 24, 24))
    for i, p in enumerate(files):
        sheet.paste(Image.open(p).resize((540, 648), Image.LANCZOS), ((i % 3) * 550, (i // 3) * 658))
    sheet.save(OUT / "_sheet.jpg", quality=90)
    print("ok")
