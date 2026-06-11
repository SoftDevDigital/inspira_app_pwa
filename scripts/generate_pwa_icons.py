#!/usr/bin/env python3
"""
Genera los iconos PWA de Inspira en múltiples tamaños a partir de un diseño base.
Diseño: fondo negro (#000000) con un destello/llama naranja (#ff8c00) y el
wordmark "INSPIRA". Crea variantes normales y una versión "maskable" con
zona segura (safe zone) para Android adaptive icons.
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (0, 0, 0, 255)            # negro del tema
ACCENT = (255, 140, 0, 255)    # #ff8c00
ACCENT_MUTED = (204, 112, 0, 255)
WHITE = (255, 255, 255, 255)

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
BASE = 1024  # render a alta resolución y luego reescalar


def load_font(size, bold=True):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


def draw_flame(draw, cx, cy, scale):
    """Dibuja un destello/llama estilizado (símbolo de inspiración)."""
    # Llama: forma de gota invertida con brillo interior
    w = int(150 * scale)
    h = int(230 * scale)
    top = (cx, cy - h // 2)
    left = (cx - w // 2, cy + h // 4)
    right = (cx + w // 2, cy + h // 4)
    bottom = (cx, cy + h // 2)
    # cuerpo externo (naranja)
    draw.polygon([top, right, bottom, left], fill=ACCENT)
    draw.ellipse([cx - w // 2, cy - h // 8, cx + w // 2, cy + h // 2], fill=ACCENT)
    # núcleo interior más claro
    iw = int(w * 0.5)
    ih = int(h * 0.45)
    draw.ellipse([cx - iw // 2, cy + ih // 8, cx + iw // 2, cy + ih // 1.1], fill=(255, 190, 90, 255))


def render_base(maskable=False):
    img = Image.new("RGBA", (BASE, BASE), BG)
    draw = ImageDraw.Draw(img)

    # Para maskable dejamos más padding (zona segura ~80% central)
    inset = int(BASE * 0.16) if maskable else int(BASE * 0.06)

    # Tarjeta/marco redondeado naranja sutil (solo en no-maskable para estética)
    if not maskable:
        margin = inset
        radius = int(BASE * 0.18)
        draw.rounded_rectangle(
            [margin, margin, BASE - margin, BASE - margin],
            radius=radius, outline=ACCENT, width=int(BASE * 0.012)
        )

    cx = BASE // 2
    # Símbolo (llama) en la parte superior-central
    flame_scale = 1.7 if not maskable else 1.45
    draw_flame(draw, cx, int(BASE * (0.40 if not maskable else 0.42)), flame_scale)

    # Wordmark "INSPIRA"
    font_size = int(BASE * (0.135 if not maskable else 0.12))
    font = load_font(font_size, bold=True)
    text = "INSPIRA"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    ty = int(BASE * (0.66 if not maskable else 0.64))
    draw.text((cx - tw // 2, ty), text, font=font, fill=WHITE)

    # Línea-acento debajo del wordmark
    line_w = int(tw * 0.45)
    line_y = ty + th + int(BASE * 0.04)
    draw.rounded_rectangle(
        [cx - line_w // 2, line_y, cx + line_w // 2, line_y + int(BASE * 0.012)],
        radius=int(BASE * 0.006), fill=ACCENT
    )
    return img


def main():
    base = render_base(maskable=False)
    base_mask = render_base(maskable=True)

    # Guardar el icono base 512 (referencia) y todas las variantes
    for size in SIZES:
        out = base.resize((size, size), Image.LANCZOS)
        out.save(os.path.join(OUT_DIR, f"icon-{size}x{size}.png"))
        print(f"  -> icon-{size}x{size}.png")

    # Maskable (192 y 512 son los recomendados)
    for size in (192, 512):
        out = base_mask.resize((size, size), Image.LANCZOS)
        out.save(os.path.join(OUT_DIR, f"maskable-{size}x{size}.png"))
        print(f"  -> maskable-{size}x{size}.png")

    # Apple touch icon (180x180) sin transparencia
    apple = base.resize((180, 180), Image.LANCZOS).convert("RGB")
    apple.save(os.path.join(OUT_DIR, "apple-touch-icon.png"))
    print("  -> apple-touch-icon.png")

    # Favicon (32x32) + icono base de referencia 512
    base.resize((32, 32), Image.LANCZOS).save(os.path.join(OUT_DIR, "favicon-32x32.png"))
    base.save(os.path.join(OUT_DIR, "icon-base-512.png"))
    print("  -> favicon-32x32.png, icon-base-512.png")
    print("Listo.")


if __name__ == "__main__":
    main()
