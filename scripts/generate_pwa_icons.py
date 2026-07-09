#!/usr/bin/env python3
"""
Genera los iconos PWA de Inspira a partir del nuevo diseño `icono.jpeg`
(llama naranja + wordmark "INSPIRA" sobre fondo azul marino).

- Iconos pequeños ("any"): SOLO la llama centrada sobre fondo azul marino
  (el texto no se lee bien en tamaños chicos).
- Iconos grandes / maskable: logo completo (llama + wordmark) con zona segura.
- apple-touch-icon y favicon derivados del mismo diseño.

Fuente del logo: /home/ubuntu/Uploads/icono.jpeg
"""
import os
from PIL import Image

SRC = "/home/ubuntu/Uploads/icono.jpeg"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

NAVY = (19, 36, 54)  # fondo azul marino del diseño

# Bounding boxes detectadas sobre icono.jpeg (1080x729)
FLAME_BBOX = (470, 144, 618, 346)       # solo la llama
FULL_BBOX = (150, 130, 930, 690)        # llama + wordmark INSPIRA

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
SMALL_FLAME_ONLY = {72, 96, 128}        # tamaños que usan solo la llama


def crop_padded(img, bbox, pad_ratio=0.12):
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    pad = int(max(w, h) * pad_ratio)
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def square_on_navy(crop, canvas, content_ratio):
    """Centra `crop` sobre un lienzo cuadrado navy de lado `canvas`."""
    bg = Image.new("RGB", (canvas, canvas), NAVY)
    max_side = int(canvas * content_ratio)
    scale = min(max_side / crop.width, max_side / crop.height)
    new = crop.resize((max(1, int(crop.width * scale)),
                       max(1, int(crop.height * scale))), Image.LANCZOS)
    ox = (canvas - new.width) // 2
    oy = (canvas - new.height) // 2
    bg.paste(new, (ox, oy))
    return bg


def main():
    src = Image.open(SRC).convert("RGB")
    flame = crop_padded(src, FLAME_BBOX, 0.18)
    full = crop_padded(src, FULL_BBOX, 0.06)

    RENDER = 1024
    flame_big = square_on_navy(flame, RENDER, 0.62)   # llama sola, aireada
    full_big = square_on_navy(full, RENDER, 0.86)     # logo completo
    mask_big = square_on_navy(full, RENDER, 0.66)     # maskable (zona segura ~66%)

    for size in SIZES:
        base = flame_big if size in SMALL_FLAME_ONLY else full_big
        out = base.resize((size, size), Image.LANCZOS)
        out.save(os.path.join(OUT_DIR, f"icon-{size}x{size}.png"))
        print(f"  -> icon-{size}x{size}.png")

    for size in (192, 512):
        out = mask_big.resize((size, size), Image.LANCZOS)
        out.save(os.path.join(OUT_DIR, f"maskable-{size}x{size}.png"))
        print(f"  -> maskable-{size}x{size}.png")

    # Apple touch icon (180x180) - logo completo, sin transparencia
    full_big.resize((180, 180), Image.LANCZOS).save(
        os.path.join(OUT_DIR, "apple-touch-icon.png"))
    print("  -> apple-touch-icon.png")

    # Favicon 32x32 (llama sola, más legible) + base 512 de referencia
    flame_big.resize((32, 32), Image.LANCZOS).save(
        os.path.join(OUT_DIR, "favicon-32x32.png"))
    full_big.save(os.path.join(OUT_DIR, "icon-base-512.png"))
    print("  -> favicon-32x32.png, icon-base-512.png")
    print("Listo. Iconos generados desde icono.jpeg")


if __name__ == "__main__":
    main()
