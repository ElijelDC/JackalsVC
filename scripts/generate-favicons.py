#!/usr/bin/env python3
"""Regenerate app favicons from public/brand/favicon.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/brand/favicon.png"
ZOOM = 1.32


def prepare_square(img: Image.Image, zoom: float) -> Image.Image:
    img = img.convert("RGBA")
    bbox = img.getbbox()
    if not bbox:
        return img

    cropped = img.crop(bbox)
    width, height = cropped.size
    side = max(width, height)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(cropped, ((side - width) // 2, (side - height) // 2))

    zoomed_side = max(1, int(round(side * zoom)))
    zoomed = square.resize((zoomed_side, zoomed_side), Image.Resampling.LANCZOS)
    offset = (zoomed_side - side) // 2
    return zoomed.crop((offset, offset, offset + side, offset + side))


def main() -> None:
    base = prepare_square(Image.open(SOURCE), ZOOM)
    ico_sizes = [(16, 16), (32, 32), (48, 48)]

    base.save(ROOT / "src/app/favicon.ico", format="ICO", sizes=ico_sizes)
    base.save(ROOT / "public/favicon.ico", format="ICO", sizes=ico_sizes)
    base.resize((32, 32), Image.Resampling.LANCZOS).save(ROOT / "src/app/icon.png")
    base.resize((180, 180), Image.Resampling.LANCZOS).save(
        ROOT / "src/app/apple-icon.png",
    )
    print(f"Generated favicons from {SOURCE} (zoom={ZOOM})")


if __name__ == "__main__":
    main()
