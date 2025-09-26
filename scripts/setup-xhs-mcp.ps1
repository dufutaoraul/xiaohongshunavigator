# 小红书MCP服务部署脚本
# 自动下载、配置和启动xiaohongshu-mcp服务

param(
    [string]$Version = "latest",
    [string]$InstallPath = ".\xhs-mcp",
    [switch]$SkipDownload = $false
)

Write-Host "🚀 开始部署小红书MCP服务..." -ForegroundColor Green

# 创建安装目录
if (!(Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force
    Write-Host "📁 创建安装目录: $InstallPath" -ForegroundColor Yellow
}

Set-Location $InstallPath

# 检测系统架构
$arch = if ([Environment]::Is64BitOperatingSystem) { "amd64" } else { "386" }
$os = "windows"

Write-Host "🔍 检测到系统: $os-$arch" -ForegroundColor Cyan

if (!$SkipDownload) {
    # 获取最新版本信息
    try {
        $releaseInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/xpzouying/xiaohongshu-mcp/releases/latest"
        $latestVersion = $releaseInfo.tag_name
        Write-Host "📦 最新版本: $latestVersion" -ForegroundColor Cyan
        
        # 查找对应的下载链接
        $mainAsset = $releaseInfo.assets | Where-Object { $_.name -like "*$os-$arch*" -and $_.name -notlike "*login*" }
        $loginAsset = $releaseInfo.assets | Where-Object { $_.name -like "*login*$os-$arch*" }
        
        if ($mainAsset) {
            Write-Host "⬇️ 下载主程序: $($mainAsset.name)" -ForegroundColor Yellow
            Invoke-WebRequest -Uri $mainAsset.browser_download_url -OutFile "xiaohongshu-mcp.exe"
        }
        
        if ($loginAsset) {
            Write-Host "⬇️ 下载登录工具: $($loginAsset.name)" -ForegroundColor Yellow
            Invoke-WebRequest -Uri $loginAsset.browser_download_url -OutFile "xiaohongshu-login.exe"
        }
        
        Write-Host "✅ 下载完成!" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ 下载失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 请手动从 https://github.com/xpzouying/xiaohongshu-mcp/releases 下载" -ForegroundColor Yellow
        exit 1
    }
}

# 创建配置文件
$configContent = @"
# 小红书MCP服务配置
port: 18060
headless: true
timeout: 30
max_retries: 3
rate_limit:
  requests_per_minute: 2
  requests_per_hour: 30
  requests_per_day: 200
"@

$configContent | Out-File -FilePath "config.yaml" -Encoding UTF8
Write-Host "📝 创建配置文件: config.yaml" -ForegroundColor Yellow

# 创建启动脚本
$startScript = @"
@echo off
echo 🚀 启动小红书MCP服务...
echo 📍 服务地址: http://localhost:18060
echo 🔗 MCP端点: http://localhost:18060/mcp
echo.
echo ⚠️  首次运行需要登录小红书账号
echo 💡 如果遇到问题，请先运行 xiaohongshu-login.exe 进行登录
echo.

REM 检查是否已登录
if not exist "cookies" (
    echo 🔐 检测到未登录，启动登录工具...
    start /wait xiaohongshu-login.exe
)

REM 启动MCP服务
xiaohongshu-mcp.exe -headless=true -port=18060

pause
"@

$startScript | Out-File -FilePath "start-mcp.bat" -Encoding ASCII
Write-Host "📝 创建启动脚本: start-mcp.bat" -ForegroundColor Yellow

# 创建登录脚本
$loginScript = @"
@echo off
echo 🔐 小红书账号登录工具
echo.
echo 📋 使用说明:
echo 1. 程序会打开浏览器窗口
echo 2. 请在浏览器中登录您的小红书账号
echo 3. 登录成功后关闭浏览器
echo 4. 登录状态会自动保存
echo.

xiaohongshu-login.exe

echo.
echo ✅ 登录完成! 现在可以启动MCP服务了
pause
"@

$loginScript | Out-File -FilePath "login.bat" -Encoding ASCII
Write-Host "📝 创建登录脚本: login.bat" -ForegroundColor Yellow

# 创建健康检查脚本
$healthScript = @"
# 检查MCP服务状态
try {
    `$response = Invoke-WebRequest -Uri "http://localhost:18060/health" -Method GET -TimeoutSec 5
    if (`$response.StatusCode -eq 200) {
        Write-Host "✅ MCP服务运行正常" -ForegroundColor Green
        `$data = `$response.Content | ConvertFrom-Json
        Write-Host "📊 服务信息:" -ForegroundColor Cyan
        Write-Host "   版本: `$(`$data.version)" -ForegroundColor White
        Write-Host "   登录状态: `$(`$data.loginStatus)" -ForegroundColor White
        Write-Host "   运行时间: `$(`$data.uptime)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ MCP服务未运行或无响应" -ForegroundColor Red
    Write-Host "💡 请运行 start-mcp.bat 启动服务" -ForegroundColor Yellow
}

# 测试MCP协议
try {
    `$mcpTest = @{
        jsonrpc = "2.0"
        method = "initialize"
        params = @{}
        id = 1
    } | ConvertTo-Json

    `$mcpResponse = Invoke-WebRequest -Uri "http://localhost:18060/mcp" -Method POST -Body `$mcpTest -ContentType "application/json" -TimeoutSec 5
    
    if (`$mcpResponse.StatusCode -eq 200) {
        Write-Host "✅ MCP协议测试成功" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ MCP协议测试失败" -ForegroundColor Red
}
"@

$healthScript | Out-File -FilePath "check-health.ps1" -Encoding UTF8
Write-Host "📝 创建健康检查脚本: check-health.ps1" -ForegroundColor Yellow

Write-Host "" 
Write-Host "🎉 小红书MCP服务部署完成!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 下一步操作:" -ForegroundColor Cyan
Write-Host "1. 双击运行 login.bat 登录小红书账号" -ForegroundColor White
Write-Host "2. 双击运行 start-mcp.bat 启动MCP服务" -ForegroundColor White
Write-Host "3. 运行 PowerShell .\check-health.ps1 检查服务状态" -ForegroundColor White
Write-Host ""
Write-Host "🔗 服务地址:" -ForegroundColor Cyan
Write-Host "   HTTP API: http://localhost:18060" -ForegroundColor White
Write-Host "   MCP端点: http://localhost:18060/mcp" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  重要提示:" -ForegroundColor Yellow
Write-Host "- 首次使用必须先登录小红书账号" -ForegroundColor White
Write-Host "- 登录后请勿在其他浏览器中登录同一账号" -ForegroundColor White
Write-Host "- 服务运行期间请保持网络连接稳定" -ForegroundColor White

Set-Location ..
