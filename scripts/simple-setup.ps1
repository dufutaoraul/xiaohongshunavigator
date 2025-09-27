# 简化的小红书MCP服务部署脚本

Write-Host "🚀 开始部署小红书MCP服务..." -ForegroundColor Green

# 创建安装目录
$InstallPath = ".\xhs-mcp"
if (!(Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force
    Write-Host "📁 创建安装目录: $InstallPath" -ForegroundColor Yellow
}

Set-Location $InstallPath

# 下载文件
Write-Host "⬇️ 下载MCP服务文件..." -ForegroundColor Yellow

$baseUrl = "https://github.com/xpzouying/xiaohongshu-mcp/releases/latest/download"
$files = @{
    "xiaohongshu-mcp-windows-amd64.exe" = "xiaohongshu-mcp.exe"
    "xiaohongshu-login-windows-amd64.exe" = "xiaohongshu-login.exe"
}

foreach ($file in $files.Keys) {
    $url = "$baseUrl/$file"
    $destination = $files[$file]
    
    Write-Host "  下载: $file -> $destination" -ForegroundColor Gray
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $destination -UseBasicParsing
        Write-Host "    ✅ 下载成功" -ForegroundColor Green
    } catch {
        Write-Host "    ❌ 下载失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 请手动从 https://github.com/xpzouying/xiaohongshu-mcp/releases 下载" -ForegroundColor Yellow
        continue
    }
}

# 创建启动脚本
Write-Host "📝 创建启动脚本..." -ForegroundColor Yellow

# 登录脚本
$loginScript = @"
@echo off
echo 🔐 启动小红书登录工具...
xiaohongshu-login.exe
pause
"@
$loginScript | Out-File -FilePath "login.bat" -Encoding ASCII

# 启动脚本
$startScript = @"
@echo off
echo 🚀 启动小红书MCP服务...
echo 服务地址: http://localhost:18060
echo MCP端点: http://localhost:18060/mcp
echo.
xiaohongshu-mcp.exe -headless=true -port=18060
pause
"@
$startScript | Out-File -FilePath "start-mcp.bat" -Encoding ASCII

# 健康检查脚本
$healthScript = @"
# 健康检查脚本
try {
    `$response = Invoke-WebRequest -Uri "http://localhost:18060/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ MCP服务运行正常" -ForegroundColor Green
    Write-Host "响应: `$(`$response.StatusCode)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ MCP服务未运行或异常" -ForegroundColor Red
    Write-Host "错误: `$(`$_.Exception.Message)" -ForegroundColor Yellow
}
"@
$healthScript | Out-File -FilePath "check-health.ps1" -Encoding UTF8

Write-Host "✅ 脚本创建完成!" -ForegroundColor Green

# 返回原目录
Set-Location ..

Write-Host ""
Write-Host "🎉 小红书MCP服务部署完成!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 下一步操作:" -ForegroundColor Cyan
Write-Host "1. 进入目录: cd xhs-mcp" -ForegroundColor White
Write-Host "2. 双击运行 login.bat 登录小红书账号" -ForegroundColor White
Write-Host "3. 双击运行 start-mcp.bat 启动MCP服务" -ForegroundColor White
Write-Host "4. 运行 PowerShell .\check-health.ps1 检查服务状态" -ForegroundColor White
Write-Host ""
Write-Host "🔗 服务地址:" -ForegroundColor Cyan
Write-Host "   HTTP API: http://localhost:18060" -ForegroundColor White
Write-Host "   MCP端点: http://localhost:18060/mcp" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  注意事项:" -ForegroundColor Yellow
Write-Host "- 首次使用需要先登录小红书账号" -ForegroundColor White
Write-Host "- 服务运行期间请保持网络连接稳定" -ForegroundColor White
Write-Host "- 如遇问题请查看服务日志" -ForegroundColor White
