"""自动维护 sw.js 的离线缓存清单。

扫描项目内所有需要离线可用的静态资源（页面、脚本、样式、图标、
启动画面、生字笔顺数据），重新生成 sw.js 里的 ASSETS 数组并自增缓存版本号。
以后新增文件后重跑本脚本即可。
"""

import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SW = os.path.join(BASE, "sw.js")

PAGES = [
    "./", "./index.html", "./kousuan.html", "./yuwen.html", "./shengzi.html",
    "./yuedu.html", "./yingyu.html", "./kexue.html", "./parent.html",
    "./wrongredo.html", "./doudizhu.html", "./minecraft.html", "./feiji.html",
    "./pool.html", "./foodchef.html", "./tangbao.html", "./manifest.json",
]

ROOT_FILES = [
    "./css/style.css",
    "./js/common.js",
    "./js/data.js",
    "./js/home.js",
    "./js/kousuan.js",
    "./js/yuwen.js",
    "./js/shengzi.js",
    "./js/yuedu.js",
    "./js/data-char.js",
    "./js/data-reading.js",
    "./js/yingyu.js",
    "./js/kexue.js",
    "./js/parent.js",
    "./js/wrongredo.js",
    "./js/doudizhu-core.js",
    "./js/doudizhu.js",
    "./js/minecraft.js",
    "./js/feiji.js",
    "./js/pool.js",
    "./js/foodchef.js",
    "./js/tangbao.js",
    "./js/vendor/hanzi-writer.min.js",
    "./js/vendor/three.min.js",
]


def scan(rel_dir: str, prefix: str) -> list[str]:
    out = []
    for name in sorted(os.listdir(os.path.join(BASE, rel_dir))):
        out.append(prefix + name)
    return out


def main() -> None:
    assets = (
        PAGES
        + ROOT_FILES
        + scan("icons", "./icons/")
        + scan("js/vendor/hanzi-data", "./js/vendor/hanzi-data/")
    )
    assets = sorted(set(assets))

    raw = open(SW, encoding="utf-8").read()
    m = re.search(r"var CACHE = '([^']+)';", raw)
    if not m:
        raise SystemExit("sw.js 中找不到 CACHE 版本行")
    cur = m.group(1)
    ver = re.search(r"(\d+)$", cur)
    new_ver = (int(ver.group(1)) + 1) if ver else "77"
    new_cache = re.sub(r"\d+$", str(new_ver), cur)

    block = "var ASSETS = [\n" + "".join(f"  {a!r},\n" for a in assets) + "];"
    raw = re.sub(r"var CACHE = '[^']+';", f"var CACHE = '{new_cache}';", raw)
    raw = re.sub(r"var ASSETS = \[.*?\];", block, raw, flags=re.S)
    open(SW, "w", encoding="utf-8").write(raw)
    print("CACHE:", new_cache, "| ASSETS:", len(assets), "个文件")


if __name__ == "__main__":
    main()
