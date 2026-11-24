"""Render launcher-style previews of assets/icon.png. Not used at runtime."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT_GRID = ROOT / "tmp-icon-preview.png"
OUT_PHONE = ROOT / "tmp-icon-phone-mock.png"
WALLPAPER = Path(
    r"C:\Users\Administrator\.cursor\projects\d-e-e-confirm-app"
    r"\assets\c__Users_Administrator_AppData_Roaming_Cursor_User_"
    r"workspaceStorage_empty-window_images_image-d6483275-36fe-4f9d-ae5d-f08292037a03.png"
)

# Honor / Magic UI style squircle (approx.)
SQUIRCLE_RADIUS_RATIO = 0.22


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def circle_mask(size: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    return mask


def checkerboard(size: int, cell: int = 24) -> Image.Image:
    im = Image.new("RGB", (size, size), (210, 210, 210))
    draw = ImageDraw.Draw(im)
    for y in range(0, size, cell):
        for x in range(0, size, cell):
            if ((x // cell) + (y // cell)) % 2 == 0:
                draw.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(180, 180, 180))
    return im


def composite(icon: Image.Image, mask: Image.Image, bg: tuple[int, int, int]) -> Image.Image:
    base = Image.new("RGBA", icon.size, bg + (255,))
    layer = icon.convert("RGBA")
    layer.putalpha(mask.resize(icon.size, Image.Resampling.NEAREST))
    base.alpha_composite(layer)
    return base.convert("RGB")


def launcher_icon(source: Image.Image, size: int) -> Image.Image:
    """Simulate Android adaptive icon on a squircle launcher."""
    mask = rounded_mask(size, max(4, int(size * SQUIRCLE_RADIUS_RATIO)))
    resized = source.resize((size, size), Image.Resampling.LANCZOS)
    rgba = resized.convert("RGBA")
    rgba.putalpha(mask)
    return rgba


def try_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_grid_preview(icon: Image.Image, brand: Image.Image) -> None:
    cols, rows = 3, 2
    tile, gap, top = 280, 28, 56
    canvas_w = gap + cols * (tile + gap)
    canvas_h = top + gap + rows * (tile + 36 + gap)
    preview = Image.new("RGB", (canvas_w, canvas_h), (16, 20, 28))
    draw = ImageDraw.Draw(preview)
    draw.text((gap, 16), "Icon asset preview  |  not packed yet", fill=(230, 230, 230))

    def put(img: Image.Image, col: int, row: int, caption: str) -> None:
        x = gap + col * (tile + gap)
        y = top + gap + row * (tile + 36 + gap)
        preview.paste(img.resize((tile, tile), Image.Resampling.LANCZOS), (x, y))
        draw.text((x, y + tile + 8), caption, fill=(240, 240, 240))

    sq = icon.resize((tile, tile), Image.Resampling.LANCZOS)
    cb = checkerboard(tile)
    cb.paste(sq, (0, 0))
    put(cb, 0, 0, "1. Source (must fill square)")

    squircle = rounded_mask(tile, int(tile * SQUIRCLE_RADIUS_RATIO))
    put(composite(sq, squircle, (16, 20, 28)), 1, 0, "2. Android rounded square")
    put(composite(sq, circle_mask(tile), (16, 20, 28)), 2, 0, "3. Circle launcher")

    old_plate = Image.new("RGBA", (tile, tile), (255, 255, 255, 255))
    inner = int(tile * 0.70)
    old_resized = brand.resize((inner, inner), Image.Resampling.LANCZOS)
    old_plate.alpha_composite(old_resized, ((tile - inner) // 2, (tile - inner) // 2))
    put(composite(old_plate.convert("RGB"), squircle, (16, 20, 28)), 0, 1, "4. OLD: white margin")
    put(composite(sq, squircle, (16, 20, 28)), 1, 1, "5. NEW: full bleed")

    preview.save(OUT_GRID)


def draw_phone_mock(icon: Image.Image, brand: Image.Image) -> None:
    """Full-screen mock using the user's wallpaper + 4-column launcher grid."""
    if not WALLPAPER.exists():
        print("wallpaper missing, skip phone mock")
        return

    wp = Image.open(WALLPAPER).convert("RGB")
    phone_w, phone_h = wp.size
    screen = wp.copy()
    screen_draw = ImageDraw.Draw(screen)

    # Layout tuned to match the user's screenshot (4 columns, status bar ~ top 120px)
    cols = 4
    icon_px = int(phone_w * 0.155)
    label_h = int(icon_px * 0.34)
    cell_w = phone_w // cols
    grid_top = int(phone_h * 0.155)
    grid_left = int(phone_w * 0.045)
    row_gap = int(icon_px * 0.55)

    font_label = try_font(max(18, int(icon_px * 0.19)))
    font_note = try_font(max(16, int(icon_px * 0.16)))

    # Generic neighbor icons (colored squircles) so e确镜 sits in a real grid
    palette = [
        (76, 175, 80),
        (33, 150, 243),
        (255, 152, 0),
        (156, 39, 176),
        (244, 67, 54),
        (0, 188, 212),
        (121, 85, 72),
        (63, 81, 181),
    ]

    def draw_app(col: int, row: int, rgba_icon: Image.Image, name: str, highlight: bool = False) -> None:
        nonlocal screen, screen_draw
        cx = grid_left + col * cell_w + (cell_w - icon_px) // 2
        cy = grid_top + row * (icon_px + row_gap)
        if highlight:
            pad = 6
            screen_draw.rounded_rectangle(
                [cx - pad, cy - pad, cx + icon_px + pad, cy + icon_px + label_h + pad + 8],
                radius=12,
                outline=(255, 220, 80),
                width=4,
            )
        layer = Image.new("RGBA", screen.size, (0, 0, 0, 0))
        layer.alpha_composite(rgba_icon, (cx, cy))
        screen = Image.alpha_composite(screen.convert("RGBA"), layer).convert("RGB")
        screen_draw = ImageDraw.Draw(screen)
        tw = screen_draw.textlength(name, font=font_label)
        screen_draw.text(
            (cx + (icon_px - tw) / 2, cy + icon_px + 6),
            name,
            fill=(255, 255, 255),
            font=font_label,
            stroke_width=2,
            stroke_fill=(0, 0, 0),
        )

    def placeholder(color: tuple[int, int, int]) -> Image.Image:
        base = Image.new("RGBA", (icon_px, icon_px), (0, 0, 0, 0))
        mask = rounded_mask(icon_px, int(icon_px * SQUIRCLE_RADIUS_RATIO))
        fill = Image.new("RGBA", (icon_px, icon_px), color + (255,))
        fill.putalpha(mask)
        base.alpha_composite(fill)
        return base

    new_icon = launcher_icon(icon, icon_px)
    old_inner = int(icon_px * 0.72)
    old_plate = Image.new("RGBA", (icon_px, icon_px), (255, 255, 255, 255))
    old_plate.alpha_composite(
        brand.resize((old_inner, old_inner), Image.Resampling.LANCZOS),
        ((icon_px - old_inner) // 2, (icon_px - old_inner) // 2),
    )
    old_icon = launcher_icon(old_plate.convert("RGB"), icon_px)

    names_row0 = ["应用 A", "应用 B", "应用 C", "应用 D"]
    names_row1 = ["应用 E", "应用 F", "应用 G", "应用 H"]
    names_row2 = ["应用 I", "应用 J", "应用 K", "旧版 e确镜"]

    for i, name in enumerate(names_row0):
        draw_app(i, 0, placeholder(palette[i]), name)
    for i, name in enumerate(names_row1):
        draw_app(i, 1, placeholder(palette[i + 4]), name)
    for i, name in enumerate(names_row2[:3]):
        draw_app(i, 2, placeholder(palette[(i + 2) % len(palette)]), name)

    # Same row: old (col 3) vs new (col 3 on row 3) — mirror user's home position
    draw_app(3, 2, old_icon, "旧版 e确镜", highlight=True)
    draw_app(3, 3, new_icon, "新版 e确镜", highlight=True)

    screen_draw.text(
        (grid_left, int(phone_h * 0.08)),
        "手机桌面模拟（你的壁纸 + 荣耀圆角方标）",
        fill=(255, 255, 255),
        font=font_note,
        stroke_width=2,
        stroke_fill=(0, 0, 0),
    )
    screen_draw.text(
        (grid_left, int(phone_h * 0.105)),
        "黄框：旧版白边  |  下方：新版（打包后应接近此效果）",
        fill=(255, 230, 160),
        font=font_note,
        stroke_width=2,
        stroke_fill=(0, 0, 0),
    )

    screen.save(OUT_PHONE)


def main() -> None:
    icon = Image.open(ASSETS / "icon.png").convert("RGB")
    brand = Image.open(ASSETS / "brand-icon.png").convert("RGBA")
    draw_grid_preview(icon, brand)
    draw_phone_mock(icon, brand)
    print(OUT_GRID)
    print(OUT_PHONE)


if __name__ == "__main__":
    main()
