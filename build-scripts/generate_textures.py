#!/usr/bin/env python3
"""
Python script to generate realistic studio textures and icons for GarageBand Windows:
1. Brushed Dark Aluminum (Metal texture for Transport bar & Knobs)
2. Vintage Oak Woodgrain (Side panels & vintage amp finish)
3. Woven Amp Grill Cloth (Retro speaker mesh texture)
4. Waveform Grid Pattern (Subtle studio grid backdrop)
5. Multi-resolution application icons (16, 32, 48, 64, 128, 256 px + .ico)
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

TEXTURES_DIR = "src/assets/images"
ICONS_DIR = "src/assets/icons"
os.makedirs(TEXTURES_DIR, exist_ok=True)
os.makedirs(ICONS_DIR, exist_ok=True)

# 1. Brushed Aluminum Texture
def generate_brushed_metal():
    width, height = 512, 128
    img = Image.new("RGBA", (width, height), (36, 38, 44, 255))
    draw = ImageDraw.Draw(img)
    random.seed(42)

    for y in range(height):
        for x in range(0, width, 4):
            val = random.randint(-12, 12)
            c = (max(0, min(255, 38 + val)),
                 max(0, min(255, 40 + val)),
                 max(0, min(255, 46 + val)), 255)
            draw.line([(x, y), (x + random.randint(8, 24), y)], fill=c)

    img = img.filter(ImageFilter.GaussianBlur(radius=0.7))
    out_path = os.path.join(TEXTURES_DIR, "brushed_metal.png")
    img.save(out_path)
    print(f"Generated {out_path}")

# 2. Rich Rosewood / Oak Grain Texture
def generate_wood_grain():
    width, height = 256, 512
    img = Image.new("RGB", (width, height), (58, 28, 18))
    draw = ImageDraw.Draw(img)
    random.seed(101)

    for y in range(height):
        # Sine-wave wood ring effect
        freq = math.sin(y * 0.04) * 8 + math.sin(y * 0.015) * 15
        base_r = int(55 + freq + random.randint(-4, 4))
        base_g = int(26 + freq * 0.5 + random.randint(-3, 3))
        base_b = int(16 + freq * 0.3 + random.randint(-2, 2))
        c = (max(20, min(100, base_r)), max(10, min(60, base_g)), max(8, min(40, base_b)))
        draw.line([(0, y), (width, y)], fill=c)

    img = img.filter(ImageFilter.GaussianBlur(radius=1.2))
    out_path = os.path.join(TEXTURES_DIR, "wood_grain.png")
    img.save(out_path)
    print(f"Generated {out_path}")

# 3. Woven Amp Grill Cloth Texture
def generate_amp_grill():
    width, height = 64, 64
    img = Image.new("RGBA", (width, height), (24, 25, 28, 255))
    draw = ImageDraw.Draw(img)

    for i in range(0, width, 4):
        # Weave warp & weft
        col_warp = (68, 62, 54, 220) if (i // 4) % 2 == 0 else (45, 42, 38, 255)
        col_weft = (82, 75, 64, 200) if (i // 4) % 2 == 1 else (35, 32, 30, 255)
        draw.line([(i, 0), (i, height)], fill=col_warp, width=2)
        draw.line([(0, i), (width, i)], fill=col_weft, width=2)

    out_path = os.path.join(TEXTURES_DIR, "amp_grill.png")
    img.save(out_path)
    print(f"Generated {out_path}")

# 4. Multi-resolution Icons with Python PIL
def generate_icons():
    # Render high-res 512x512 icon
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded Squircle base
    rect_box = [20, 20, 492, 492]
    draw.rounded_rectangle(rect_box, radius=110, fill=(34, 24, 18, 255), outline=(72, 52, 40, 255), width=6)

    # Soundwave speaker rings
    for r in range(120, 210, 30):
        draw.ellipse([256 - r, 256 - r, 256 + r, 256 + r], outline=(245, 158, 11, 40), width=3)

    # Electric Guitar Silhouette Body (Sunburst gradient effect)
    guitar_pts = [
        (256, 110), (330, 160), (360, 230), (330, 310),
        (350, 390), (310, 450), (210, 450), (170, 390),
        (190, 310), (160, 230), (190, 160)
    ]
    draw.polygon(guitar_pts, fill=(217, 72, 15, 255), outline=(62, 10, 10, 255))

    # Inner Sunburst
    inner_pts = [
        (256, 170), (300, 200), (320, 250), (300, 320),
        (310, 380), (280, 410), (230, 410), (200, 380),
        (210, 320), (190, 250), (210, 200)
    ]
    draw.polygon(inner_pts, fill=(251, 191, 36, 240))

    # Pickups
    draw.rounded_rectangle([220, 270, 292, 290], radius=5, fill=(30, 30, 35, 255), outline=(120, 120, 130, 255), width=2)
    draw.rounded_rectangle([220, 315, 292, 335], radius=5, fill=(30, 30, 35, 255), outline=(120, 120, 130, 255), width=2)

    # Guitar Neck & Frets
    draw.rectangle([242, 20, 270, 180], fill=(180, 150, 120, 255), outline=(60, 40, 25, 255), width=3)
    for fret_y in range(40, 180, 25):
        draw.line([(242, fret_y), (270, fret_y)], fill=(255, 215, 0, 255), width=2)

    # Strings
    for sx in [246, 251, 256, 261, 266]:
        draw.line([(sx, 20), (sx, 370)], fill=(255, 255, 255, 220), width=2)

    # Save PNG resolutions
    sizes = [16, 32, 48, 64, 128, 256]
    resized_images = []
    for s in sizes:
        resized = img.resize((s, s), Image.Resampling.LANCZOS)
        png_path = os.path.join(ICONS_DIR, f"garageband-{s}.png")
        resized.save(png_path)
        resized_images.append(resized)

    # Save .ico containing multi-res bitmaps
    ico_path = os.path.join(ICONS_DIR, "garageband.ico")
    img.save(ico_path, format="ICO", sizes=[(s, s) for s in sizes])
    print(f"Generated {ico_path} and PNG icons")

if __name__ == "__main__":
    generate_brushed_metal()
    generate_wood_grain()
    generate_amp_grill()
    generate_icons()
    print("All Python textures generated successfully!")
