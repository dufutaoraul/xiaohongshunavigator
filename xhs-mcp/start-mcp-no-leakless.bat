@echo off
echo 🚀 启动小红书MCP服务 (禁用leakless模式)...
echo 服务地址: http://localhost:18060
echo MCP端点: http://localhost:18060/mcp
echo API端点: http://localhost:18060/api/v1
echo.
echo ⚠️  注意: 已禁用leakless功能以解决Windows兼容性问题
echo.

REM 检查端口是否被占用
netstat -an | find "18060" > nul
if %errorlevel% == 0 (
    echo ⚠️  端口18060已被占用，尝试终止现有进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| find "18060"') do taskkill /pid %%a /f > nul 2>&1
    timeout /t 2 > nul
)

REM 设置环境变量禁用leakless
set ROD_LEAKLESS=false
set ROD_NO_LEAKLESS=true
set DISABLE_LEAKLESS=true

echo 🔧 启动参数: -headless=true -port=18060
echo.

REM 启动服务
xiaohongshu-mcp.exe -headless=true -port=18060
pause
