#!/usr/bin/env python3
"""Renders every planned flyer for the first caption batch into content/flyer-samples/batch/ and builds numbered grids.
The numbers exist only on the grid sheets (a badge in the corner), never on the flyers themselves."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
import mega as M
import style_lab as L
import templates as T
from hero_dish import render, BRAND

OUT = T.OUT
(OUT / "batch").mkdir(parents=True, exist_ok=True)
ANAT = [("aguacate", (0.19, 0.58), (0.04, 0.10), (30, 40)), ("papa al horno", (0.66, 0.30), (0.50, 0.07), (-40, 30)),
        ("carne y queso", (0.55, 0.62), (0.40, 0.90), (-30, -30))]


def hero(dish, headline, bg, name, variant="none", line=""):
    p = OUT / "batch" / f"{name}.jpg"
    render(dish, headline, bg, p, variant, line)
    return p


# (caption id, label, builder)
SPECS = [
    ("dish-tacos-alambre", "Mega-type, red", lambda n: M.mega("tacos-alambre", ["Tacos", "de alambre"], "red-tonal", f"batch/{n}")),
    ("dish-tacos-dorados", "Hero circle, yellow", lambda n: hero("tacos-deshebrada", "Tacos dorados", "yellow-tonal", n, "footer", "Ven a disfrutarlos")),
    ("dish-chiles-rellenos", "Mega-type, green", lambda n: M.mega("chiles-rellenos", ["Chiles", "rellenos"], "green-tonal", f"batch/{n}")),
    ("dish-chilaquiles-montados", "Mega-type, red", lambda n: M.mega("chilaquiles-montados", ["Hoy toca", "chila", "quiles"], "red-tonal", f"batch/{n}", sub="Ven a disfrutarlos", max_type_h=540, dish_w=900)),
    ("dish-chilaquiles-sencillos", "Hero circle, white", lambda n: hero("chilaquiles-sencillos", "Chilaquiles", "white-red", n)),
    ("dish-enchiladas-verdes", "Mega-type, yellow", lambda n: M.mega("enchiladas-verdes", ["Enchiladas", "verdes"], "yellow-tonal", f"batch/{n}")),
    ("dish-caldo-res", "Hero circle, green", lambda n: hero("caldo-res-2", "Caldo de res", "green-tonal", n)),
    ("dish-caldo-ranchero", "Mega-type, red", lambda n: M.mega("caldo-ranchero", ["Caldo", "ranchero"], "red-tonal", f"batch/{n}")),
    ("dish-club-sandwich", "Hero circle, yellow", lambda n: hero("club-sandwich", "Club sandwich", "yellow-tonal", n)),
    ("dish-platillo-mexicano", "Mega-type, green", lambda n: M.mega("platillo-mexicano", ["Platillo", "mexicano"], "green-tonal", f"batch/{n}")),
    ("dish-tostada", "Hero circle, red", lambda n: hero("tostada-deshebrada", "Tostada de deshebrada", "red-tonal", n)),
    ("ritual-martes-caldo", "Mega-type, yellow", lambda n: M.mega("caldo-res-2", ["Martes", "de caldo"], "yellow-tonal", f"batch/{n}", sub="¿Con limón o sin limón?")),
    ("ritual-sabado-chilaquiles", "Mega-type, red", lambda n: M.mega("chilaquiles-sencillos", ["Sábado de", "chilaquiles"], "red-tonal", f"batch/{n}")),
    ("ritual-jueves-tacos", "Mega-type, green", lambda n: M.mega("tacos-deshebrada", ["Jueves", "de tacos"], "green-tonal", f"batch/{n}", sub="¿De alambre o dorados?")),
    ("temporada-frio-caldo-res", "Hero + kicker, red", lambda n: hero("caldo-res-2", "Caldo de res", "red-tonal", n, "kicker", "Hoy hace frío")),
    ("temporada-frio-caldo-ranchero", "Mega-type, green", lambda n: M.mega("caldo-ranchero", ["Frío afuera,", "caldo adentro"], "green-tonal", f"batch/{n}")),
    ("temporada-frio-enchiladas", "Hero + kicker, white", lambda n: hero("enchiladas-verdes", "Enchiladas verdes", "white-green", n, "kicker", "Día frío")),
    ("fecha-candelaria", "Lettering + dish, red", lambda n: T.lettering("No tenemos tamales", "pero, ¿no prefieres unos chilaquiles?", "solid-red", "chilaquiles-montados", f"batch/{n}")),
    ("fecha-amor-amistad-carrusel", "Carousel 1/4, red", lambda n: T.pun_slide("Eres la salsa de mi taco", "solid-red", "tacos-deshebrada", f"batch/{n}")),
    ("fecha-amor-amistad-carrusel", "Carousel 2/4, yellow", lambda n: T.pun_slide("Eres el queso de mis chilaquiles", "solid-yellow", "chilaquiles-sencillos", f"batch/{n}")),
    ("fecha-amor-amistad-carrusel", "Carousel 3/4, red", lambda n: T.pun_slide("Eres el limón de mi caldo", "solid-red", "caldo-res-2", f"batch/{n}")),
    ("fecha-amor-amistad-carrusel", "Carousel 4/4, red pattern", lambda n: T.pun_final("Etiqueta a tu persona favorita", "red-tonal", f"batch/{n}")),
    ("fecha-madres-teaser", "Type-only, red", lambda n: M.type_poster(["¿Ya sabes dónde", "vas a comer", "con mamá?"], "red-tonal", f"batch/{n}", accent=2)),
    ("fecha-madres", "Type-only, white", lambda n: M.type_poster(["Feliz día,", "mamá"], "white-red", f"batch/{n}", accent=1, sub="El mejor sazón es tuyo")),
    ("fecha-padre-teaser", "Type-only, green", lambda n: M.type_poster(["¿Y si invitas", "a papá", "a comer?"], "green-tonal", f"batch/{n}", accent=1)),
    ("fecha-padre", "Type-only, yellow", lambda n: M.type_poster(["Feliz día,", "papá"], "yellow-tonal", f"batch/{n}", accent=1, sub="Gracias por tanto")),
    ("poll-caldo-chilaquiles", "Poll, split", lambda n: T.split_question("¿Qué se antoja hoy?", "Caldo", "Chilaquiles", f"batch/{n}")),
    ("poll-tacos-enchiladas", "Poll, split", lambda n: T.split_question("Si tuvieras que elegir", "Tacos", "Enchiladas", f"batch/{n}")),
    ("tag-desayunar", "Type-only, red", lambda n: M.type_poster(["Etiqueta a quien", "invitarías a", "desayunar"], "red-tonal", f"batch/{n}", accent=2)),
    ("tag-caldo", "Type-only, yellow", lambda n: M.type_poster(["Etiqueta a tu", "compañero", "de caldo"], "yellow-tonal", f"batch/{n}", accent=2)),
    ("statement-frio-caldo", "Type-only, green", lambda n: M.type_poster(["Si hace frío,", "hay", "caldo."], "green-tonal", f"batch/{n}", accent=2)),
    ("statement-chilaquiles", "Type-only + crop, red", lambda n: M.type_poster(["Chilaquiles", "arreglan todo"], "red-tonal", f"batch/{n}", crop=True)),
    ("anatomia-alambre", "Real photo, annotated", lambda n: L.photo_post("tacos alambre 1", "Así se ve por dentro", "Tacos de alambre", "green-tonal", f"batch/{n}", "lilita", "lilita", photo_h=640, notes=ANAT)),
    ("review-gracias-1", "Review card (placeholder)", lambda n: T.review("[Reseña real de Google, elegida por ti]", "red-tonal", f"batch/{n}")),
    ("review-gracias-2", "Review card (placeholder)", lambda n: T.review("[Reseña real de Google, elegida por ti]", "green-tonal", f"batch/{n}")),
]


def label_strip(n, text, w, strip=46):
    st = Image.new("RGB", (w, strip), (20, 20, 20))
    d = ImageDraw.Draw(st)
    fn = ImageFont.truetype(str(BRAND / "fonts" / "LilitaOne-Regular.ttf"), 34)
    fl = ImageFont.truetype(str(BRAND / "fonts" / "Nunito-Variable.ttf"), 20)
    d.ellipse((8, 5, 8 + 36, 5 + 36), fill=(250, 204, 23))
    d.text((26, 24), str(n), font=fn, fill=(20, 20, 20), anchor="mm")
    d.text((56, 24), text, font=fl, fill=(235, 235, 235), anchor="lm")
    return st


if __name__ == "__main__":
    files = []
    for i, (cid, label, build) in enumerate(SPECS, 1):
        name = f"n{i:02d}"
        files.append(Path(build(name)))
        print(i, cid, flush=True)
    json.dump([{"n": i, "caption_id": c, "style": l, "file": f"batch/n{i:02d}.jpg"} for i, (c, l, _) in enumerate(SPECS, 1)],
              open(OUT / "batch" / "index.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
    w, h, strip = 400, 480, 46
    per = 12
    for s in range(0, len(files), per):
        chunk = files[s:s + per]
        sheet = Image.new("RGB", (4 * w + 24, 3 * (h + strip) + 16), (20, 20, 20))
        for k, p in enumerate(chunk):
            im = Image.open(p).convert("RGB").resize((w, h), Image.LANCZOS)
            x, y = (k % 4) * (w + 8), (k // 4) * (h + strip + 8)
            sheet.paste(im, (x, y))
            sheet.paste(label_strip(s + k + 1, SPECS[s + k][1], w), (x, y + h))
        sheet.save(OUT / f"_grid{s // per + 1}.jpg", quality=88)
    print("done", len(files))
