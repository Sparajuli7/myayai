#!/usr/bin/env python3
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]

ASSETS_DIR = ROOT / "myayai-extension" / "assets" / "icons"
STORE_DIR = ROOT / "store-assets"
SCREENSHOTS_DIR = STORE_DIR / "screenshots"

def ensure_dirs():
    for p in [ASSETS_DIR, SCREENSHOTS_DIR]:
        p.mkdir(parents=True, exist_ok=True)

def get_font(size: int):
    # Use a default PIL font as a fallback; try common system fonts
    try:
        return ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", size)
    except Exception:
        try:
            return ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", size)
        except Exception:
            return ImageFont.load_default()

def create_icon(size: int, filename: str):
    img = Image.new("RGBA", (size, size), (19, 27, 38, 255))
    draw = ImageDraw.Draw(img)
    # Rounded square
    radius = max(6, size // 8)
    draw.rounded_rectangle([(0,0),(size-1,size-1)], radius=radius, fill=(25, 32, 45, 255))
    # Accent circle
    r = size // 3
    cx, cy = size // 2, size // 2
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=(0, 145, 255, 230))
    # Monogram
    font = get_font(size // 3)
    text = "A"
    tw, th = draw.textbbox((0,0), text, font=font)[2:]
    draw.text((cx - tw/2, cy - th/2), text, font=font, fill=(255,255,255,255))
    out = ASSETS_DIR / filename
    img.save(out)
    return out

def create_promo(width: int, height: int, filename: str, title: str, subtitle: str):
    img = Image.new("RGB", (width, height), (17, 24, 39))
    draw = ImageDraw.Draw(img)
    # Gradient stripes
    for i in range(0, height, 6):
        shade = 24 + (i % 48)
        draw.rectangle([(0,i),(width, i+3)], fill=(shade, shade+2, shade+5))
    # Title
    title_font = get_font(min(width//12, 64))
    subtitle_font = get_font(min(width//24, 32))
    tw, th = draw.textbbox((0,0), title, font=title_font)[2:]
    draw.text(((width - tw)/2, height*0.28 - th/2), title, font=title_font, fill=(255,255,255))
    sw, sh = draw.textbbox((0,0), subtitle, font=subtitle_font)[2:]
    draw.text(((width - sw)/2, height*0.28 + th/2 + 12), subtitle, font=subtitle_font, fill=(180, 210, 255))
    # Tagline pill
    pill = "One‑click prompt optimization"
    pill_font = get_font(min(width//32, 22))
    pw, ph = draw.textbbox((0,0), pill, font=pill_font)[2:]
    pad = 16
    box = [(width - pw)//2 - pad, int(height*0.70 - ph/2 - 10), (width + pw)//2 + pad, int(height*0.70 + ph/2 + 10)]
    draw.rounded_rectangle(box, radius=18, fill=(0, 145, 255))
    draw.text(((width - pw)/2, height*0.70 - ph/2), pill, font=pill_font, fill=(0,0,0))
    out = STORE_DIR / filename
    img.save(out)
    return out

def create_screenshot(idx: int, title: str, subtitle: str):
    width, height = 1280, 800
    img = Image.new("RGB", (width, height), (14, 19, 30))
    draw = ImageDraw.Draw(img)
    # Header bar
    draw.rectangle([(0,0),(width, 96)], fill=(25, 35, 56))
    # Title and subtitle
    title_font = get_font(52)
    subtitle_font = get_font(28)
    draw.text((48, 28), title, font=title_font, fill=(255,255,255))
    draw.text((48, 96+24), subtitle, font=subtitle_font, fill=(185,205,235))
    # Placeholder UI blocks
    y = 180
    for i in range(3):
        draw.rounded_rectangle([(48, y), (width-48, y+140)], radius=16, outline=(70,90,130), width=2, fill=(22,30,48))
        y += 160
    # Footer note
    foot_font = get_font(18)
    draw.text((48, height-40), "Placeholder screenshot (auto‑generated)", font=foot_font, fill=(150,170,200))
    out = SCREENSHOTS_DIR / f"screenshot-{idx}.png"
    img.save(out)
    return out

def main():
    ensure_dirs()
    # Icons for manifest
    create_icon(16, "icon16.png")
    create_icon(32, "icon32.png")
    create_icon(48, "icon48.png")
    create_icon(128, "icon128.png")
    # Store listing placeholders (also drop a hero in screenshots)
    create_screenshot(1, "One‑click Optimization", "Upgrade prompts while preserving intent")
    create_screenshot(2, "Dashboard & Insights", "Track improvements and time saved")
    create_screenshot(3, "Works Across Platforms", "ChatGPT, Claude, Gemini, Perplexity, Copilot, Poe")
    create_screenshot(4, "Achievements", "Build better prompting habits over time")
    create_screenshot(5, "Before → After", "See improvements called out clearly")
    # Promo tile
    create_promo(440, 280, "promo-440x280.png", "MyAyAI", "AI Prompt Optimizer")
    print("Generated icons, screenshots, and promo placeholders.")

if __name__ == "__main__":
    main()


