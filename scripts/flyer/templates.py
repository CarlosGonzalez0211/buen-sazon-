#!/usr/bin/env python3
"""Other post types, all 1080x1296 JPEG in the brand kit's colours and fonts:
lettering (special dates, joke or greeting), pun_slide (carousel), anatomy (exploded dish), review (Google quote)."""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from hero_dish import (BACKGROUNDS, BRAND, C, CUTOUTS, H, ROOT, S, THEMES, W, font_body, font_display, tracked, wrap)

OUT = ROOT / "content" / "flyer-samples"


def base(bg):
    pattern, key = BACKGROUNDS[bg]
    canvas = Image.open(next(BRAND.joinpath("backgrounds").glob(pattern))).convert("RGBA").resize((W * S, H * S), Image.LANCZOS)
    return canvas, ImageDraw.Draw(canvas), THEMES[key]


def logo_at(canvas, t, width, cx=None, bottom=44):
    lg = Image.open(BRAND / "logos" / t["logo"]).convert("RGBA")
    lw = width * S
    lg = lg.resize((lw, int(lg.height * lw / lg.width)), Image.LANCZOS)
    x = (W * S // 2 if cx is None else cx * S) - lg.width // 2
    canvas.alpha_composite(lg, (x, H * S - bottom * S - lg.height))
    return lg.height


def logo_h(t, width):
    lg = Image.open(BRAND / "logos" / t["logo"])
    return int(width * S * lg.height / lg.width)


def arrow(d, x, y, size, fill):
    """Right-pointing arrow ending at x (Nunito has no arrow glyph)."""
    d.line([(x - 3.2 * size, y), (x - 0.4 * size, y)], fill=fill, width=int(size * 0.28))
    d.polygon([(x, y), (x - size, y - size * 0.6), (x - size, y + size * 0.6)], fill=fill)


def cutout(name, width=None, height=None):
    img = Image.open(CUTOUTS / f"{name}.png").convert("RGBA")
    img = img.crop(img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
    k = min((width * S / img.width) if width else 9, (height * S / img.height) if height else 9)
    return img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS)


def drop(canvas, img, xy, strength=0.38, blur=18):
    sh = Image.new("RGBA", img.size, (0, 0, 0, 255))
    sh.putalpha(img.getchannel("A").point(lambda v: int(v * strength)))
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.paste(sh, (xy[0], xy[1] + 16 * S), sh)
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur * S)))
    canvas.alpha_composite(img, xy)


def save(canvas, name):
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / f"{name}.jpg"
    canvas.convert("RGB").resize((W, H), Image.LANCZOS).save(p, "JPEG", quality=92, optimize=True)
    return p


def center_block(d, lines, font, fill, y, leading=0.98):
    for ln in lines:
        d.text((W * S / 2, y), ln, font=font, fill=fill, anchor="ma")
        y += int(font.size * leading)
    return y


def lettering(headline, support, bg, dish, name):
    """Special-date graphic: big lettering, a supporting line, a small dish at the bottom."""
    canvas, d, t = base(bg)
    lines, fh, px = wrap(d, headline, 150 * S, 900 * S)
    y = center_block(d, lines, fh, C[t["head"]], 110 * S)
    y += 22 * S
    fs = font_body(54 * S)
    words, ln, rows = support.split(), "", []
    for w_ in words:
        if d.textlength((ln + " " + w_).strip(), font=fs) > 840 * S:
            rows.append(ln); ln = w_
        else:
            ln = (ln + " " + w_).strip()
    rows.append(ln)
    for r in rows:
        d.text((W * S / 2, y), r, font=fs, fill=C[t["body"]], anchor="ma"); y += 66 * S
    top_free, bot_free = y + 30 * S, H * S - 44 * S - logo_h(t, 300) - 36 * S
    img = cutout(dish, width=960, height=(bot_free - top_free) / S)
    drop(canvas, img, (W * S // 2 - img.width // 2, top_free + (bot_free - top_free - img.height) // 2))
    logo_at(canvas, t, 300)
    return save(canvas, name)


def pun_slide(text, bg, dish, name, hint="desliza"):
    """One carousel slide: the pun in big lettering with the dish it names."""
    canvas, d, t = base(bg)
    lines, fh, px = wrap(d, text, 150 * S, 900 * S)
    y = center_block(d, lines, fh, C[t["head"]], 120 * S)
    top_free, bot_free = y + 20 * S, H * S - 150 * S
    img = cutout(dish, width=960, height=(bot_free - top_free) / S)
    drop(canvas, img, (W * S // 2 - img.width // 2, top_free + (bot_free - top_free - img.height) // 2))
    if hint:
        fx = font_body(32 * S)
        d.text((W * S - 64 * S - 110 * S, H * S - 56 * S), hint.upper(), font=fx, fill=C[t["body"]], anchor="rs")
        arrow(d, W * S - 64 * S, H * S - 68 * S, 26 * S, C[t["body"]])
    return save(canvas, name)


def pun_final(text, bg, name):
    canvas, d, t = base(bg)
    lines, fh, px = wrap(d, text, 130 * S, 880 * S)
    y = center_block(d, lines, fh, C[t["head"]], 300 * S)
    d.rectangle((W * S / 2 - 70 * S, y + 20 * S, W * S / 2 + 70 * S, y + 28 * S), fill=C[t["rule"]])
    logo_at(canvas, t, 520, bottom=380)
    return save(canvas, name)


def anatomy(title, dish, labels, bg, name):
    """Exploded dish: callout label + leader line per component. labels = [(text, (fx, fy), side)]
    where (fx, fy) is the target as a fraction of the dish image and side is 'L' or 'R'."""
    canvas, d, t = base(bg)
    lines, fh, px = wrap(d, title, 120 * S, 900 * S)
    y = center_block(d, lines, fh, C[t["head"]], 70 * S)
    img = cutout(dish, width=720, height=640)
    top_free, bot_free = y + 70 * S, H * S - 44 * S - logo_h(t, 340) - 60 * S
    cx, cy = W * S // 2, (top_free + bot_free) // 2
    ix, iy = cx - img.width // 2, cy - img.height // 2
    drop(canvas, img, (ix, iy))
    ink = C[t["pill"][1]]
    fill = C[t["pill"][0]]
    f = font_body(38 * S)
    d = ImageDraw.Draw(canvas)
    L = sorted([l for l in labels if l[2] == "L"], key=lambda l: l[1][1])
    R = sorted([l for l in labels if l[2] == "R"], key=lambda l: l[1][1])
    for side, group in (("L", L), ("R", R)):
        for i, (text, (fx, fy), _) in enumerate(group):
            tx, ty = ix + int(img.width * fx), iy + int(img.height * fy)
            ly = iy - 30 * S + int((i + 0.5) * (img.height + 60 * S) / max(len(group), 1))
            tw = d.textlength(text, font=f)
            pw, ph = tw + 44 * S, 70 * S
            px0 = 36 * S if side == "L" else W * S - 36 * S - pw
            d.line([(px0 + (pw if side == "L" else 0), ly), (tx, ty)], fill=C[t["rule"]], width=4 * S)
            d.ellipse((tx - 9 * S, ty - 9 * S, tx + 9 * S, ty + 9 * S), fill=C[t["rule"]])
            d.rounded_rectangle((px0, ly - ph / 2, px0 + pw, ly + ph / 2), radius=ph / 2, fill=fill)
            d.text((px0 + pw / 2, ly), text, font=f, fill=ink, anchor="mm")
    logo_at(canvas, t, 340)
    return save(canvas, name)


def star(d, cx, cy, r, fill):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.42
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill)


def review(quote, bg, name, credit="Cliente en Google"):
    """Real-review quote card. `quote` must be a real review text."""
    canvas, d, t = base(bg)
    d.text((W * S / 2, 150 * S), "“", font=font_display(300 * S), fill=C[t["head"]], anchor="mt")
    fq = font_body(58 * S)
    words, ln, rows = quote.split(), "", []
    for w_ in words:
        if d.textlength((ln + " " + w_).strip(), font=fq) > 820 * S:
            rows.append(ln); ln = w_
        else:
            ln = (ln + " " + w_).strip()
    rows.append(ln)
    y = 470 * S
    for r in rows:
        d.text((W * S / 2, y), r, font=fq, fill=C[t["body"]], anchor="ma"); y += 76 * S
    y += 40 * S
    for i in range(5):
        star(d, W * S / 2 + (i - 2) * 76 * S, y + 30 * S, 30 * S, C[t["head"]])
    d.text((W * S / 2, y + 90 * S), credit.upper(), font=font_body(34 * S), fill=C[t["body"]], anchor="ma")
    logo_at(canvas, t, 340)
    return save(canvas, name)


# ---- text-only posts ---------------------------------------------------------------------------------

def stack(canvas, d, lines, top, bottom, gap=18):
    """Centered block of (text, colour, size_px, kind) lines, vertically centred between top and bottom."""
    fonts = [(font_display if k == "display" else font_body)(sz * S) for _, _, sz, k in lines]
    heights = [int(f.size * 1.0) for f in fonts]
    total = sum(heights) + gap * S * (len(lines) - 1)
    y = top + (bottom - top - total) // 2
    for (text, col, sz, k), f, h in zip(lines, fonts, heights):
        d.text((W * S / 2, y), text, font=f, fill=col, anchor="ma")
        y += h + gap * S


def statement(lines_spec, bg, name, logo_w=300):
    """Big typographic statement. lines_spec = [(text, 'head'|'body'|'accent', size)]; 'accent' uses the rule colour."""
    canvas, d, t = base(bg)
    col = {"head": C[t["head"]], "body": C[t["body"]], "accent": C[t["rule"]]}
    lines = []
    for txt, kind, sz in lines_spec:
        if kind != "body":
            lines.append((txt.upper(), col[kind], sz, "display"))
            continue
        fb = font_body(sz * S)
        row = ""
        for word in txt.split():
            if d.textlength((row + " " + word).strip(), font=fb) > 860 * S:
                lines.append((row, col[kind], sz, "body")); row = word
            else:
                row = (row + " " + word).strip()
        lines.append((row, col[kind], sz, "body"))
    stack(canvas, d, lines, 70 * S, H * S - 44 * S - logo_h(t, logo_w) - 40 * S)
    logo_at(canvas, t, logo_w)
    return save(canvas, name)


def pattern_bg(key):
    pattern, _ = BACKGROUNDS[key]
    return Image.open(next(BRAND.joinpath("backgrounds").glob(pattern))).convert("RGBA").resize((W * S, H * S), Image.LANCZOS)


def split_question(question, left, right, name):
    """Two-colour split poll, every area patterned. Text outside the halves sits on green bands so each pair stays readable."""
    canvas = pattern_bg("red-tonal")
    canvas.paste(pattern_bg("yellow-tonal").crop((W * S // 2, 0, W * S, H * S)), (W * S // 2, 0))
    top_h, bot_h = 330 * S, 330 * S
    green = pattern_bg("green-tonal")
    canvas.paste(green.crop((0, 0, W * S, top_h)), (0, 0))
    canvas.paste(green.crop((0, H * S - bot_h, W * S, H * S)), (0, H * S - bot_h))
    d = ImageDraw.Draw(canvas)
    lines, fq, px = wrap(d, question, 110 * S, 900 * S)
    y = top_h // 2 - int(len(lines) * px * 0.98) // 2
    for ln in lines:
        d.text((W * S / 2, y), ln, font=fq, fill=C["yellow"], anchor="ma")
        y += int(px * 0.98)
    mid = (top_h + H * S - bot_h) // 2
    for word, cx, col in ((left, W * S // 4, C["white"]), (right, 3 * W * S // 4, C["red"])):
        size = 100
        fw = font_display(size * S)
        while d.textlength(word.upper(), font=fw) > (W * S / 2 - 150 * S) and size > 36:
            size -= 4
            fw = font_display(size * S)
        d.text((cx, mid), word.upper(), font=fw, fill=col, anchor="mm")
    cr = 46 * S
    d.ellipse((W * S // 2 - cr, mid - cr, W * S // 2 + cr, mid + cr), fill=C["green"])
    d.text((W * S / 2, mid), "O", font=font_display(64 * S), fill=C["yellow"], anchor="mm")
    d.text((W * S / 2, H * S - bot_h + 40 * S), "VOTA EN LOS COMENTARIOS", font=font_body(36 * S), fill=C["white"], anchor="ma")
    lg = Image.open(BRAND / "logos" / THEMES["green"]["logo"]).convert("RGBA")
    lw = 300 * S
    lg = lg.resize((lw, int(lg.height * lw / lg.width)), Image.LANCZOS)
    canvas.alpha_composite(lg, (W * S // 2 - lg.width // 2, H * S - 36 * S - lg.height))
    return save(canvas, name)


# ---- sticker style (inspired by the owner's references) ------------------------------------------

def die_cut(img, border):
    """Thick white outline around a cutout, like a sticker."""
    import numpy as np
    from scipy import ndimage
    a = np.array(img.getchannel("A")) > 128
    pad = border + 4
    big = np.pad(a, pad)
    dist = ndimage.distance_transform_edt(~big)
    mask = Image.fromarray(((dist <= border) * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.2))
    white = Image.new("RGBA", mask.size, (255, 255, 255, 255))
    white.putalpha(mask)
    out = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    out.alpha_composite(white)
    out.alpha_composite(img, (pad, pad))
    return out


def sparkle(d, cx, cy, r, fill):
    pts = []
    for i in range(8):
        ang = i * math.pi / 4
        rr = r if i % 2 == 0 else r * 0.22
        pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang)))
    d.polygon(pts, fill=fill)


def sticker_hero(dish, line1, line2, bg, name, tilt=-6):
    """Left-aligned stacked headline, die-cut dish bleeding off the right edge, small corner logo, sparkles."""
    canvas, d, t = base(bg)
    x0 = 70 * S
    f1, f2 = font_display(96 * S), font_display(190 * S)
    size2 = 190
    while d.textlength(line2.upper(), font=f2) > (W - 140) * S and size2 > 90:
        size2 -= 6
        f2 = font_display(size2 * S)
    d.text((x0, 345 * S), line1.upper(), font=f1, fill=C[t["head"]], anchor="ls")
    d.text((x0, 345 * S + int(size2 * S * 0.92)), line2.upper(), font=f2, fill=C["white"] if t["head"] != "red" else C["red"], anchor="ls")
    lg = Image.open(BRAND / "logos" / t["logo"]).convert("RGBA")
    lw = 230 * S
    lg = lg.resize((lw, int(lg.height * lw / lg.width)), Image.LANCZOS)
    canvas.alpha_composite(lg, (x0, 56 * S))

    img = cutout(dish, width=1050)
    st = die_cut(img, 22 * S).rotate(tilt, resample=Image.BICUBIC, expand=True)
    px, py = W * S - st.width + 150 * S, 620 * S
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sh = Image.new("RGBA", st.size, (0, 0, 0, 255)); sh.putalpha(st.getchannel("A").point(lambda v: int(v * 0.35)))
    layer.paste(sh, (px + 6 * S, py + 20 * S), sh)
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(16 * S)))
    layer2 = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer2.paste(st, (px, py), st)
    canvas.alpha_composite(layer2)

    d = ImageDraw.Draw(canvas)
    for (fx, fy, r) in ((0.86, 0.34, 46), (0.93, 0.46, 24), (0.08, 0.60, 30), (0.78, 0.60, 20)):
        sparkle(d, int(W * S * fx), int(H * S * fy), r * S, C[t["rule"]])
    return save(canvas, name)


if __name__ == "__main__":
    from hero_dish import render
    OUT.mkdir(parents=True, exist_ok=True)
    render("caldo-res-2", "Martes de caldo", "yellow-tonal", OUT / "ex1-ritual.jpg", "footer", "¿Con limón o sin limón?")
    render("caldo-ranchero", "Caldo ranchero", "green-tonal", OUT / "ex2-temporada.jpg", "kicker", "Hoy hace frío")
    lettering("No tenemos tamales", "pero, ¿no prefieres unos chilaquiles?", "solid-yellow", "chilaquiles-montados", "ex3-candelaria")
    pun_slide("Eres la salsa de mi taco", "solid-red", "tacos-deshebrada", "ex4-amor-1")
    pun_slide("Eres el queso de mis chilaquiles", "solid-yellow", "chilaquiles-sencillos", "ex4-amor-2")
    pun_final("Etiqueta a tu persona favorita", "green-tonal", "ex4-amor-3")
    anatomy("Anatomía del alambre", "tacos-alambre",
            [("Aguacate", (0.17, 0.62), "L"), ("Jitomate", (0.30, 0.22), "L"), ("Lechuga", (0.45, 0.14), "R"),
             ("Papa al horno", (0.80, 0.25), "R"), ("Carne y queso", (0.58, 0.62), "R")], "solid-yellow", "ex5-anatomia")
    review("[Aquí va una reseña real de Google, elegida por ti]", "yellow-tonal", "ex6-resena")
    print("done")
