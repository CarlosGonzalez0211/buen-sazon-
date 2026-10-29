#!/usr/bin/env python3
"""Mega-type dish post (inspired by the owner's references): enormous Lilita One headline stacked in chunks,
dish overlapping the type with a big tinted shadow, a starburst sticker, tiny subline, small corner logo.
One dominant colour per post."""
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import templates as T
from hero_dish import BRAND, C, H, S, THEMES, W

FONT = BRAND / "fonts" / "LilitaOne-Regular.ttf"
BODY = BRAND / "fonts" / "Nunito-Variable.ttf"

# per family: type colour, shadow colour (darker shade of the background), starburst fill/ink, small-text colour
SCHEMES = {
    "red": dict(type="#FFFFFF", shadow="#6E0107", burst=("#FACC17", "#AC020B"), small="#FFFFFF"),
    "green": dict(type="#FACC17", shadow="#011C12", burst=("#FFFFFF", "#023C26"), small="#FFFFFF"),
    "yellow": dict(type="#AC020B", shadow="#B08A00", burst=("#AC020B", "#FACC17"), small="#023C26"),
}
SCHEMES["white"] = dict(type="#AC020B", shadow="#C9C2B0", burst=("#AC020B", "#FFFFFF"), small="#023C26", accent="#023C26")
SCHEMES["red"]["accent"] = "#FACC17"
SCHEMES["green"]["accent"] = "#FFFFFF"
SCHEMES["yellow"]["accent"] = "#023C26"
BG_FAMILY = {"red-tonal": "red", "green-tonal": "green", "yellow-tonal": "yellow", "white-red": "white", "white-green": "white", "white-yellow": "white"}


def lil(px):
    return ImageFont.truetype(str(FONT), px)


def nun(px):
    f = ImageFont.truetype(str(BODY), px)
    try:
        f.set_variation_by_axes([800])
    except Exception:
        pass
    return f


def ink(font, text):
    l, t, r, b = font.getbbox(text)
    return l, t, r, b


def starburst(d, cx, cy, r, fill, points=14):
    pts = []
    for i in range(points * 2):
        a = i * math.pi / points
        rr = r if i % 2 == 0 else r * 0.82
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill)


def mega(dish, lines, bg, name, badge=None, sub=None, dish_w=1040, tilt=-4, max_type_h=600):
    fam = BG_FAMILY[bg]
    sc = SCHEMES[fam]
    canvas, d, t = T.base(bg)
    x0, maxw = 60 * S, (W - 120) * S

    # headline: every chunk fitted to the full width, capped so short chunks do not become absurdly tall
    sizes = []
    for ln in lines:
        px = 600 * S
        while px > 40 * S:
            f = lil(px)
            if ink(f, ln.upper())[2] - ink(f, ln.upper())[0] <= maxw:
                break
            px -= 4 * S
        sizes.append(min(px, 400 * S))
    gap = 26 * S
    heights = [ink(lil(s), ln.upper())[3] - ink(lil(s), ln.upper())[1] for s, ln in zip(sizes, lines)]
    total = sum(heights) + gap * (len(lines) - 1)
    k = min(1.0, max_type_h * S / total)
    sizes = [int(s * k) for s in sizes]
    heights = [ink(lil(s), ln.upper())[3] - ink(lil(s), ln.upper())[1] for s, ln in zip(sizes, lines)]
    total = sum(heights) + int(gap * k) * (len(lines) - 1)

    y = 190 * S
    type_boxes = []
    for s, ln, h in zip(sizes, lines, heights):
        f = lil(s)
        l, tt, r, b = ink(f, ln.upper())
        d.text((x0 - l, y - tt), ln.upper(), font=f, fill=sc["type"])
        type_boxes.append((x0, y, x0 + (r - l), y + h))
        y += h + int(gap * k)
    type_bottom = y - int(gap * k)

    # logo, small, top right
    lg = Image.open(BRAND / "logos" / t["logo"]).convert("RGBA")
    lg = lg.resize((210 * S, int(lg.height * 210 * S / lg.width)), Image.LANCZOS)
    canvas.alpha_composite(lg, (W * S - 60 * S - lg.width, 56 * S))

    # dish: overlaps only the bottom third of the last line, so the headline stays readable
    img = T.cutout(dish, width=dish_w)
    img = img.rotate(tilt, resample=Image.BICUBIC, expand=True)
    overlap = -int(52 * S)  # keep the headline fully readable: the tilted dish's raised edge must clear the letters
    avail = H * S - 150 * S - (type_bottom - overlap)
    if img.height > avail > 300 * S:  # shrink the dish to the space under the type instead of riding up over it
        k2 = avail / img.height
        img = img.resize((int(img.width * k2), int(img.height * k2)), Image.LANCZOS)
    px0 = max(10 * S, min((W * S - img.width) // 2 + 20 * S, W * S - img.width - 10 * S))  # centred, fully inside the frame
    py0 = type_bottom - overlap
    # balance: if the whole composition leaves room at the bottom, shift everything down a little
    free = (H * S - 150 * S) - (py0 + img.height)
    shift = max(0, int(free * 0.5))
    if shift:
        shifted = canvas.crop((0, 0, W * S, H * S))
        # redraw the type lower by moving the canvas content: re-render is simpler, so offset the dish instead
        py0 += int(free * 0.9)
    py0 = min(py0, H * S - 150 * S - img.height)
    sil = Image.new("RGBA", img.size, sc["shadow"])
    sil.putalpha(img.getchannel("A").point(lambda v: int(v * 0.78)))
    lay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    lay.paste(sil, (px0 + 70 * S, py0 + 80 * S), sil)
    canvas.alpha_composite(lay.filter(ImageFilter.GaussianBlur(6 * S)))
    lay2 = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    lay2.paste(img, (px0, py0), img)
    canvas.alpha_composite(lay2)

    d = ImageDraw.Draw(canvas)
    # starburst sticker: up and to the left of the dish, over the type
    if badge:
        r = 150 * S
        bx, by = W * S - 215 * S, py0 + img.height + 5 * S
        st = Image.new("RGBA", (2 * r + 20 * S, 2 * r + 20 * S), (0, 0, 0, 0))
        sd = ImageDraw.Draw(st)
        starburst(sd, r + 10 * S, r + 10 * S, r, sc["burst"][0])
        rows = badge.split("\n")
        fb = nun(44 * S)
        yy = r + 10 * S - int(len(rows) * 52 * S / 2) + 26 * S
        for row in rows:
            sd.text((r + 10 * S, yy), row, font=fb, fill=sc["burst"][1], anchor="mm")
            yy += 52 * S
        st = st.rotate(10, resample=Image.BICUBIC, expand=True)
        canvas.alpha_composite(st, (bx - r, by - r))
        d = ImageDraw.Draw(canvas)
    if sub:
        d.text((x0, H * S - 64 * S), sub.upper(), font=nun(38 * S), fill=sc["small"], anchor="ls")
    return T.save(canvas, name)


def type_poster(lines, bg, name, accent=None, sub=None, crop=False):
    """No-photo poster: the type is the image. lines = list of strings; accent = index of the one line in the accent colour.
    crop=True: a single oversized word bleeds off the right edge (use on one short word only)."""
    fam = BG_FAMILY[bg]
    sc = SCHEMES[fam]
    canvas, d, t = T.base(bg)
    x0, maxw = 60 * S, (W - 120) * S
    lg = Image.open(BRAND / "logos" / t["logo"]).convert("RGBA")
    lg = lg.resize((210 * S, int(lg.height * 210 * S / lg.width)), Image.LANCZOS)
    canvas.alpha_composite(lg, (W * S - 60 * S - lg.width, 56 * S))
    if crop:
        word = lines[0].upper()
        px = 80 * S
        while ink(lil(px), word)[2] - ink(lil(px), word)[0] < int(W * S * 1.07):
            px += 10 * S
        f = lil(px)
        l, tt, r, b = ink(f, word)
        y = (H * S - (b - tt)) // 2 - 40 * S
        d.text((40 * S - l, y - tt), word, font=f, fill=sc["type"])
        for extra in lines[1:]:
            d.text((x0, y + (b - tt) + 60 * S), extra.upper(), font=nun(54 * S), fill=sc["accent"], anchor="la")
    else:
        sizes = []
        for ln in lines:
            px = 600 * S
            while px > 40 * S and ink(lil(px), ln.upper())[2] - ink(lil(px), ln.upper())[0] > maxw:
                px -= 4 * S
            sizes.append(min(px, 330 * S))
        gap = 30 * S
        hs = [ink(lil(s), ln.upper())[3] - ink(lil(s), ln.upper())[1] for s, ln in zip(sizes, lines)]
        total = sum(hs) + gap * (len(lines) - 1)
        k = min(1.0, 900 * S / total)
        sizes = [int(s * k) for s in sizes]
        hs = [ink(lil(s), ln.upper())[3] - ink(lil(s), ln.upper())[1] for s, ln in zip(sizes, lines)]
        total = sum(hs) + int(gap * k) * (len(lines) - 1)
        y = max(210 * S, (H * S - total) // 2)
        for i, (s, ln, h) in enumerate(zip(sizes, lines, hs)):
            f = lil(s)
            l, tt, r, b = ink(f, ln.upper())
            d.text((x0 - l, y - tt), ln.upper(), font=f, fill=sc["accent"] if i == accent else sc["type"])
            y += h + int(gap * k)
    if sub:
        d.text((x0, H * S - 64 * S), sub.upper(), font=nun(38 * S), fill=sc["small"], anchor="ls")
    return T.save(canvas, name)


if __name__ == "__main__":
    a = mega("chilaquiles-montados", ["Hoy toca", "chila", "quiles"], "red-tonal", "mega1", sub="Ven a disfrutarlos")
    b = mega("caldo-res-2", ["Martes", "de caldo"], "green-tonal", "mega2", sub="¿Con limón o sin limón?", dish_w=900)
    c = mega("tacos-alambre", ["Jueves", "de tacos"], "yellow-tonal", "mega3", dish_w=900)
    sheet = Image.new("RGB", (3 * 540, 648), (30, 30, 30))
    for i, p in enumerate((a, b, c)):
        sheet.paste(Image.open(p).resize((540, 648), Image.LANCZOS), (i * 540, 0))
    sheet.save(T.OUT / "_mega.jpg", quality=90)
    print("ok")
