#!/usr/bin/env python3
"""Regenerate favicons / PWA icons from the Jackals logo with safe padding.

The logo must sit inside the square with clear margin so bolt tips are not
clipped in browser tabs, bookmarks, or maskable PWA crops.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

# Primary source: full wolf + lightning on black (repo brand asset).
SOURCE = ROOT / "public/brand/jvc-logo.png"

# Content fills this fraction of the canvas (rest is equal padding).
# ~0.68 ≈ 16% margin each side — matches the rounded-square reference
# treatment so bolt tips stay clear of tab / maskable crops.
CONTENT_RATIO = 0.68

# Opaque black matches the logo plate and avoids transparent “holes” in some OS crops.
BG = (0, 0, 0, 255)


def content_bbox(img: Image.Image, threshold: int = 28) -> tuple[int, int, int, int]:
    """Bounding box of non-near-black, non-transparent pixels."""
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 20 and (r > threshold or g > threshold or b > threshold):
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    if maxx < 0:
        return (0, 0, w, h)
    return (minx, miny, maxx + 1, maxy + 1)


def extract_logo(img: Image.Image) -> Image.Image:
    """Crop to logo content and center on a tight transparent square."""
    img = img.convert("RGBA")
    box = content_bbox(img)
    cropped = img.crop(box)
    w, h = cropped.size
    side = max(w, h)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(cropped, ((side - w) // 2, (side - h) // 2), cropped)
    return square


def fit_on_square(logo: Image.Image, size: int, content_ratio: float) -> Image.Image:
    """Center a tight logo on a black square with safe padding."""
    canvas = Image.new("RGBA", (size, size), BG)
    target = max(1, int(round(size * content_ratio)))
    fitted = logo.resize((target, target), Image.Resampling.LANCZOS)
    offset = (size - target) // 2
    canvas.paste(fitted, (offset, offset), fitted)
    return canvas


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source logo: {SOURCE}")

    logo = extract_logo(Image.open(SOURCE))
    brand = ROOT / "public/brand"

    save_png(fit_on_square(logo, 512, CONTENT_RATIO), brand / "favicon.png")
    save_png(fit_on_square(logo, 192, CONTENT_RATIO), brand / "icon-192.png")
    save_png(fit_on_square(logo, 512, CONTENT_RATIO), brand / "icon-512.png")
    save_png(fit_on_square(logo, 180, CONTENT_RATIO), brand / "apple-touch-icon.png")
    save_png(fit_on_square(logo, 32, CONTENT_RATIO), brand / "icon-32.png")
    save_png(fit_on_square(logo, 16, CONTENT_RATIO), brand / "icon-16.png")

    ico_base = fit_on_square(logo, 256, CONTENT_RATIO)
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_path_app = ROOT / "src/app/favicon.ico"
    ico_path_public = ROOT / "public/favicon.ico"
    ico_base.save(ico_path_app, format="ICO", sizes=ico_sizes)
    shutil.copy2(ico_path_app, ico_path_public)

    save_png(fit_on_square(logo, 32, CONTENT_RATIO), ROOT / "src/app/icon.png")
    save_png(fit_on_square(logo, 180, CONTENT_RATIO), ROOT / "src/app/apple-icon.png")
    save_png(fit_on_square(logo, 512, CONTENT_RATIO), ROOT / "public/favicon.png")

    probe = fit_on_square(logo, 32, CONTENT_RATIO)
    edge = [probe.getpixel(p) for p in [(0, 0), (31, 0), (0, 31), (31, 31), (16, 0), (0, 16)]]
    print(f"Generated favicons from {SOURCE.name} (content_ratio={CONTENT_RATIO})")
    print(f"Tight logo size: {logo.size}")
    print(f"32px edge samples (expect near-black): {edge}")


if __name__ == "__main__":
    main()
