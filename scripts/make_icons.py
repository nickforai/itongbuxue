"""生成学习乐园图标（微笑太阳）：icon-180 / 192 / 512 PNG"""
import math
import os

from PIL import Image, ImageDraw

SIZES = [180, 192, 512]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")


def draw(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    r = int(size * 0.24)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=(255, 179, 0, 255))

    cx = cy = size / 2
    body = size * 0.30
    ray = size * 0.20
    width = max(3, int(size * 0.045))

    # 光芒
    for i in range(8):
        ang = math.radians(i * 45 - 90)
        x0 = cx + math.cos(ang) * body * 0.86
        y0 = cy + math.sin(ang) * body * 0.86
        x1 = cx + math.cos(ang) * (body * 0.86 + ray)
        y1 = cy + math.sin(ang) * (body * 0.86 + ray)
        d.line([x0, y0, x1, y1], fill=(255, 140, 0, 255), width=width)

    # 脸
    d.ellipse([cx - body, cy - body, cx + body, cy + body], fill=(255, 224, 102, 255))

    # 眼睛
    er = size * 0.035
    ex = cx - body * 0.38
    ey = cy - body * 0.12
    d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=(90, 60, 20, 255))
    d.ellipse([cx + body * 0.38 - er, ey - er, cx + body * 0.38 + er, ey + er], fill=(90, 60, 20, 255))

    # 微笑
    d.arc(
        [cx - body * 0.42, cy - body * 0.22, cx + body * 0.42, cy + body * 0.48],
        start=20, end=160, fill=(90, 60, 20, 255), width=width,
    )

    # 腮红
    blush = size * 0.12
    d.ellipse([cx - body * 0.78, cy + body * 0.10, cx - body * 0.30, cy + body * 0.42], fill=(255, 150, 130, 150))
    d.ellipse([cx + body * 0.30, cy + body * 0.10, cx + body * 0.78, cy + body * 0.42], fill=(255, 150, 130, 150))

    return img


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for s in SIZES:
        path = os.path.join(OUT, f"icon-{s}.png")
        draw(s).save(path)
        print("wrote", path)


if __name__ == "__main__":
    main()
