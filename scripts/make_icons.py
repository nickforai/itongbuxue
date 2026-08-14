"""生成 i同步学 图标（阳光书本）与 iPad 启动画面。

图标：暖金渐变圆角方块 + 太阳 + 打开的书本；
启动画面：米色背景 + 居中图标 + 品牌名，覆盖 iPad 各机型横竖屏。
"""

import math
import os

from PIL import Image, ImageDraw, ImageFont

SIZES = [180, 192, 512]

# iPad 常见机型（逻辑分辨率 @2x 物理像素，横竖屏各一组）
SPLASHES = [
    (1536, 2048), (2048, 1536),   # iPad mini 5/6、iPad 9.7/10.2（768x1024）
    (1668, 2224), (2224, 1668),   # iPad Air 10.5 / Pro 10.5（834x1112）
    (1640, 2360), (2360, 1640),   # iPad 10.9（820x1180）
    (1668, 2388), (2388, 1668),   # iPad Pro 11 / Air 4/5（834x1194）
    (2048, 2732), (2732, 2048),   # iPad Pro 12.9（1024x1366）
]

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, "icons")

BG_TOP = (255, 215, 94, 255)
BG_BOTTOM = (255, 159, 28, 255)
INK = (92, 53, 0, 255)
CREAM = (255, 248, 231, 255)


def _font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                idx = 2 if (weight == "bold" and "PingFang" in path) else 0
                return ImageFont.truetype(path, size=size, index=idx)
            except Exception:
                try:
                    return ImageFont.truetype(path, size=size)
                except Exception:
                    continue
    return ImageFont.load_default()


def _gradient_bg(size: int) -> Image.Image:
    """垂直渐变背景（金黄 → 橙）。"""
    img = Image.new("RGB", (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(1, size - 1)
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        d.line([(0, y), (size, y)], fill=(r, g, b))
    return img


def _rounded(src: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", src.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, src.width - 1, src.height - 1], radius=radius, fill=255)
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    out.paste(src, (0, 0), mask)
    return out


def draw_icon(size: int) -> Image.Image:
    """阳光书本图标：太阳 + 打开的书。"""
    bg = _gradient_bg(size)
    img = _rounded(bg.convert("RGBA"), radius=int(size * 0.22))
    d = ImageDraw.Draw(img)

    cx = cy = size / 2
    sun_r = size * 0.16
    sun_cy = cy - size * 0.24
    ray = size * 0.09
    lw = max(3, int(size * 0.035))

    # 太阳光芒
    for i in range(12):
        ang = math.radians(i * 30 - 90)
        x0 = cx + math.cos(ang) * sun_r * 1.05
        y0 = sun_cy + math.sin(ang) * sun_r * 1.05
        x1 = cx + math.cos(ang) * (sun_r * 1.05 + ray)
        y1 = sun_cy + math.sin(ang) * (sun_r * 1.05 + ray)
        d.line([x0, y0, x1, y1], fill=(255, 140, 0, 255), width=lw)

    # 太阳
    d.ellipse([cx - sun_r, sun_cy - sun_r, cx + sun_r, sun_cy + sun_r], fill=(255, 224, 102, 255))

    # 打开的书（白色双页 + 书脊）
    bw = size * 0.30
    bh = size * 0.16
    spine_x = cx
    top_y = cy + size * 0.10
    bot_y = cy + size * 0.46
    left = [
        (spine_x - bw * 1.9, top_y + bh * 0.35),
        (spine_x - bw * 1.9, bot_y - bh * 0.35),
        (spine_x, bot_y),
        (spine_x, top_y),
    ]
    right = [
        (spine_x + bw * 1.9, top_y + bh * 0.35),
        (spine_x + bw * 1.9, bot_y - bh * 0.35),
        (spine_x, bot_y),
        (spine_x, top_y),
    ]
    d.polygon(left, fill=(255, 255, 255, 255))
    d.polygon(right, fill=(255, 255, 255, 255))
    d.line([(spine_x, top_y), (spine_x, bot_y)], fill=(255, 159, 28, 255), width=max(2, int(size * 0.02)))

    # 书页上的文字行（模拟内容）
    line_w = int(size * 0.022)
    for k in range(3):
        ty = top_y + bh * (0.45 + k * 0.42)
        d.line(
            [(spine_x + bw * 0.35, ty), (spine_x + bw * 1.55, ty)],
            fill=(240, 190, 120, 255), width=line_w,
        )
        d.line(
            [(spine_x - bw * 0.35, ty), (spine_x - bw * 1.55, ty)],
            fill=(240, 190, 120, 255), width=line_w,
        )

    return img


def draw_splash(w: int, h: int) -> Image.Image:
    img = Image.new("RGBA", (w, h), CREAM)
    icon = draw_icon(int(min(w, h) * 0.26))
    icon = icon.resize((int(min(w, h) * 0.30), int(min(w, h) * 0.30)), Image.LANCZOS)
    img.paste(icon, ((w - icon.width) // 2, int(h * 0.34)), icon)

    d = ImageDraw.Draw(img)
    font = _font(int(min(w, h) * 0.075), weight="bold")
    text = "i同步学"
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (w - tw) / 2 - bbox[0]
    ty = int(h * 0.34) + icon.height + int(h * 0.055)
    d.text((tx, ty), text, font=font, fill=INK, stroke_width=max(1, w // 900), stroke_fill=(255, 235, 190, 255))
    return img


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for s in SIZES:
        path = os.path.join(OUT, f"icon-{s}.png")
        draw_icon(s).save(path)
        print("wrote", path)
    for w, h in SPLASHES:
        path = os.path.join(OUT, f"splash-{w}x{h}.png")
        draw_splash(w, h).save(path)
        print("wrote", path)


if __name__ == "__main__":
    main()
