#!/bin/bash
# i同步学 · 局域网服务一键启动
# 双击本文件即可，iPad 上 Safari 打开终端里显示的地址
cd "$(dirname "$0")"

IP=$(ifconfig 2>/dev/null | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -1)

echo ""
echo "=============================================="
echo "  i同步学 · 局域网服务已启动"
echo ""
echo "  iPad 的 Safari 打开：http://${IP}:8000"
echo ""
echo "  关闭服务：按 Ctrl+C，或直接关掉这个窗口"
echo "=============================================="
echo ""

python3 -m http.server 8000
