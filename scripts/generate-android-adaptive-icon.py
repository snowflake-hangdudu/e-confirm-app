"""Generate safe Android adaptive-icon foreground layers from the approved brand artwork."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "icon.png"
FOREGROUND = ROOT / "assets" / "android-icon-foreground.png"
MONOCHROME = ROOT / "assets" / "android-icon-monochrome.png"

# Android's 108dp foreground canvas has a 66dp mask-safe area.  A 600px
# mark in this 1024px source canvas leaves a small additional visual margin.
SAFE_MARK_SIZE = 600
BRAND_BOTTOM_Y = 780


def white_mark(source: Image.Image) -> Image.Image:
    rgb = source.convert("RGB")
    alpha = Image.new("L", rgb.size)
    pixels = []
    for y in range(rgb.height):
        for x in range(rgb.width):
            red, green, blue = rgb.getpixel((x, y))
            # The approved logo mark is neutral white; this excludes the blue
            # background and the product-name plate at the bottom.
            value = min(red, green, blue)
            chroma = max(red, green, blue) - value
            visible = y < BRAND_BOTTOM_Y and value > 160 and chroma < 52
            pixels.append(max(0, min(255, (value - 160) * 3 if visible else 0)))
    alpha.putdata(pixels)
    bounds = alpha.getbbox()
    if not bounds:
        raise RuntimeError("Could not locate the white e + shield logo mark.")
    mark = Image.new("RGBA", rgb.size, (255, 255, 255, 0))
    mark.putalpha(alpha)
    return mark.crop(bounds)


def centered_safe_layer(mark: Image.Image) -> Image.Image:
    scale = min(SAFE_MARK_SIZE / mark.width, SAFE_MARK_SIZE / mark.height)
    size = (round(mark.width * scale), round(mark.height * scale))
    resized = mark.resize(size, Image.Resampling.LANCZOS)
    layer = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    position = ((1024 - size[0]) // 2, (1024 - size[1]) // 2)
    layer.alpha_composite(resized, position)
    return layer


def main() -> None:
    mark = white_mark(Image.open(SOURCE))
    layer = centered_safe_layer(mark)
    layer.save(FOREGROUND)
    # Android uses the alpha silhouette of the monochrome layer for themed icons.
    layer.save(MONOCHROME)
    print(f"Generated {FOREGROUND.name} and {MONOCHROME.name}: {layer.getbbox()}")


if __name__ == "__main__":
    main()
