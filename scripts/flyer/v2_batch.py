#!/usr/bin/env python3
"""Renders the whole post library in the overlap style (poster.py) into content/flyer-samples/v2/<caption-id>[-k].jpg
and writes content/flyer-samples/v2/index.json (images + colour family per caption) plus numbered review sheets.
Row splits are chosen by hand: short chunks, every row readable even with the plate on top."""
import json
from PIL import Image, ImageDraw, ImageFont
import poster as P
from hero_dish import BRAND

# (caption id, slide or None, builder args). Families follow the old library so the colour rotation stays the same.
D = lambda dish, rows, bg, sub=None, **kw: ("dish", dict(dish=dish, rows=rows, bg=bg, sub=sub, **kw))
T_ = lambda rows, bg, **kw: ("type", dict(rows=rows, bg=bg, **kw))

LIB = [
    ("dish-tacos-alambre", [D("tacos-alambre", ["Tacos de", "alambre"], "red-tonal")]),
    ("dish-tacos-dorados", [D("tacos-deshebrada", ["Tacos", "dora", "dos"], "yellow-tonal", "Ven a disfrutarlos")]),
    ("dish-chiles-rellenos", [D("chiles-rellenos", ["Chiles", "rellenos"], "green-tonal", dish_w=1000)]),
    ("dish-chilaquiles-montados", [D("chilaquiles-montados", ["Hoy toca", "chila", "quiles"], "red-tonal", "Ven a disfrutarlos", dish_w=1000)]),
    ("dish-chilaquiles-sencillos", [D("chilaquiles-sencillos", ["Chila", "quiles"], "white-red", dish_w=1000)]),
    ("dish-enchiladas-verdes", [D("enchiladas-verdes", ["Enchi", "ladas", "ver", "des"], "yellow-tonal")]),
    ("dish-caldo-res", [D("caldo-res-2", ["Caldo", "de", "res"], "green-tonal")]),
    ("dish-caldo-ranchero", [D("caldo-ranchero", ["Caldo", "ran", "chero"], "red-tonal")]),
    ("dish-club-sandwich", [D("club-sandwich", ["Club", "sand", "wich"], "yellow-tonal")]),
    ("dish-platillo-mexicano", [D("platillo-mexicano", ["Platillo", "mexicano"], "green-tonal", dish_w=1000)]),
    ("dish-tostada", [D("tostada-deshebrada", ["Tostada", "deshe", "brada"], "red-tonal", dish_w=1000)]),
    ("ritual-martes-caldo", [D("caldo-res-2", ["Martes", "de", "caldo"], "yellow-tonal", "¿Con limón o sin limón?")]),
    ("ritual-sabado-chilaquiles", [D("chilaquiles-sencillos", ["Sábado", "de", "chila", "quiles"], "red-tonal")]),
    ("ritual-jueves-tacos", [D("tacos-deshebrada", ["Jueves", "de", "tacos"], "green-tonal", "¿De alambre o dorados?")]),
    ("temporada-frio-caldo-res", [D("caldo-res-2", ["Hoy", "hace", "frío"], "red-tonal", "Caldo de res")]),
    ("temporada-frio-caldo-ranchero", [D("caldo-ranchero", ["Frío afuera", "caldo", "adentro"], "green-tonal", dish_w=1000)]),
    ("temporada-frio-caldo", [D("caldo-res-2", ["Día", "frío"], "white-green", "Caldo de res")]),
    ("fecha-candelaria", [D("chilaquiles-montados", ["No", "tenemos", "tamales"], "red-tonal", "pero, ¿no prefieres unos chilaquiles?")]),
    ("fecha-amor-amistad-carrusel", [
        D("tacos-deshebrada", ["Eres", "la salsa", "de mi", "taco"], "red-tonal", swipe=True),
        D("chilaquiles-sencillos", ["Eres el", "queso de", "mis chila", "quiles"], "yellow-tonal", swipe=True),
        D("caldo-res-2", ["Eres el", "limón de", "mi caldo"], "red-tonal", swipe=True),
        T_(["Etiqueta", "a tu", "persona", "favorita"], "red-tonal", accent=3, big_logo=True),
    ]),
    ("fecha-madres-teaser", [T_(["¿Ya sabes", "dónde vas", "a comer", "con mamá?"], "red-tonal", accent=3)]),
    ("fecha-madres", [T_(["Feliz", "día,", "mamá"], "white-red", accent=2, sub="El mejor sazón es tuyo")]),
    ("fecha-padre-teaser", [T_(["¿Y si", "invitas", "a papá", "a comer?"], "green-tonal", accent=2)]),
    ("fecha-padre", [T_(["Feliz", "día,", "papá"], "yellow-tonal", accent=2, sub="Gracias por tanto")]),
    ("poll-caldo-chilaquiles", [T_(["Caldo", "o", "chila", "quiles?"], "yellow-tonal", accent=1, sub="Cuéntanos en los comentarios")]),
    ("poll-tacos-enchiladas", [T_(["Tacos", "o", "enchi", "ladas?"], "green-tonal", accent=1, sub="Cuéntanos en los comentarios")]),
    ("tag-desayunar", [T_(["Etiqueta", "a quien", "invitarías a", "desayunar"], "red-tonal", accent=3, big_logo=True)]),
    ("tag-caldo", [T_(["Etiqueta", "a tu", "compañero", "de caldo"], "yellow-tonal", accent=3, big_logo=True)]),
    ("statement-frio-caldo", [T_(["Si hace", "frío,", "hay", "caldo."], "green-tonal", accent=3)]),
    ("statement-chilaquiles", [T_(["Chila", "quiles", "arreglan", "todo."], "red-tonal", accent=3)]),
]


def label_strip(n, text, w, strip=46):
    st = Image.new("RGB", (w, strip), (20, 20, 20))
    d = ImageDraw.Draw(st)
    fn = ImageFont.truetype(str(BRAND / "fonts" / "LilitaOne-Regular.ttf"), 34)
    fl = ImageFont.truetype(str(BRAND / "fonts" / "Nunito-Variable.ttf"), 20)
    d.ellipse((8, 5, 44, 41), fill=(250, 204, 23))
    d.text((26, 24), str(n), font=fn, fill=(20, 20, 20), anchor="mm")
    d.text((56, 24), text, font=fl, fill=(235, 235, 235), anchor="lm")
    return st


if __name__ == "__main__":
    index, files, labels = {}, [], []
    for cid, slides in LIB:
        names = []
        for k, (kind, kw) in enumerate(slides, 1):
            name = cid if len(slides) == 1 else f"{cid}-{k}"
            kw = dict(kw)
            p = P.poster(kw.pop("dish"), kw.pop("rows"), kw.pop("bg"), name, **kw) if kind == "dish" else P.typeonly(kw.pop("rows"), kw.pop("bg"), name, **kw)
            names.append(f"social/{name}.jpg")
            files.append(p)
            labels.append(name)
        bg = slides[0][1]["bg"]
        index[cid] = {"images": names, "family": P.BG_FAMILY[bg]}
        print(cid, flush=True)
    json.dump(index, open(P.OUT / "index.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
    w, h, strip, per = 400, 480, 46, 12
    for s in range(0, len(files), per):
        chunk = files[s:s + per]
        sheet = Image.new("RGB", (4 * w + 24, 3 * (h + strip) + 16), (20, 20, 20))
        for k, p in enumerate(chunk):
            x, y = (k % 4) * (w + 8), (k // 4) * (h + strip + 8)
            sheet.paste(Image.open(p).convert("RGB").resize((w, h), Image.LANCZOS), (x, y))
            sheet.paste(label_strip(s + k + 1, labels[s + k], w), (x, y + h))
        sheet.save(P.OUT / f"_grid{s // per + 1}.jpg", quality=90)
    print("done", len(files))
