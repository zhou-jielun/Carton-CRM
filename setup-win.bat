@echo off
chcp 65001 >nul
title Carton CRM - Windows 初始化
echo ========================================
echo   Carton CRM - Windows 首次运行初始化
echo ========================================
echo.

:: 检查 Node.js
echo [1/4] 检查环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请先安装：https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装: 
node -v

:: 检查 PostgreSQL
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  未在 PATH 中找到 psql
    echo    请确保 PostgreSQL 已安装并添加到 PATH
    echo    下载: https://www.postgresql.org/download/windows/
    echo.
    echo    安装后，默认连接信息:
    echo    主机: localhost
    echo    端口: 5432
    echo    用户: postgres
    echo    密码: (安装时设置的密码)
) else (
    echo ✅ PostgreSQL 已安装
)

:: 检查 .env 配置
echo.
echo [2/4] 检查配置文件...
if exist "resources\backend\.env" (
    echo ✅ 找到 .env 配置文件
) else (
    echo ❌ 未找到 resources\backend\.env
    echo    请复制并修改配置:
    echo    copy resources\backend\.env.example resources\backend\.env
)

:: 创建数据库
echo.
echo [3/4] 配置数据库...
echo 请输入 PostgreSQL 连接信息（默认直接回车）:
set /p DB_HOST="主机 [localhost]: "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="端口 [5432]: "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_USER="用户 [postgres]: "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_PASS="密码: "

set /p DB_NAME="数据库名 [carton_crm]: "
if "%DB_NAME%"=="" set DB_NAME=carton_crm

echo.
echo 创建数据库 %DB_NAME%...

:: 设置 PGPASSWORD 环境变量
set PGPASSWORD=%DB_PASS%

:: 创建数据库
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ 数据库已创建
) else (
    echo ⚠️  数据库可能已存在，跳过创建
)

:: 运行 Prisma 迁移
echo.
echo [4/4] 初始化数据表...
cd resources\backend
set DATABASE_URL=postgresql://%DB_USER%:%DB_PASS%@%DB_HOST%:%DB_PORT%/%DB_NAME%
npx prisma db push --accept-data-loss
if %errorlevel% equ 0 (
    echo ✅ 数据表已创建
) else (
    echo ❌ 数据表创建失败，请检查数据库连接
    pause
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo   ✅ 初始化完成！
echo.
echo   双击 Carton CRM.exe 启动程序
echo   浏览器访问: http://localhost:3001
echo   首先注册账号即可使用
echo ========================================
pause
