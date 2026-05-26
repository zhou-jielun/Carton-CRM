#!/bin/bash
# Carton CRM - 开发环境一键启动
# 用法: ./start.sh

set -e
cd "$(dirname "$0")"

echo "🚀 Carton CRM 开发环境启动..."

# ── 检查 PostgreSQL ──
if brew services list 2>/dev/null | grep -q "postgresql.*started"; then
    echo "✅ PostgreSQL 已运行"
else
    echo "❌ PostgreSQL 未运行，请先启动：brew services start postgresql@16"
    exit 1
fi

# ── 清理旧进程 ──
echo "🧹 清理旧进程..."
lsof -ti :3001 2>/dev/null | xargs kill 2>/dev/null || true
lsof -ti :5173 2>/dev/null | xargs kill 2>/dev/null || true
sleep 1

# ── 启动（关键：unset NODE_OPTIONS，Node v24 拒绝 --use-system-ca） ──
echo "⚡ 启动后端 (3001)..."
unset NODE_OPTIONS
npx concurrently --names "BACKEND,FRONTEND" \
    "npm run dev:backend" \
    "npm run dev:frontend"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 前后端已启动"
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
