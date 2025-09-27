# 修复 Visual C++ 运行时库问题
# 解决 side-by-side configuration 错误

Write-Host "🔧 修复 Visual C++ 运行时库问题..." -ForegroundColor Green

# 检查系统架构
$arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
Write-Host "检测到系统架构: $arch" -ForegroundColor Cyan

# Visual C++ 2015-2022 Redistributable 下载链接
$vcredist_urls = @{
    "x64" = "https://aka.ms/vs/17/release/vc_redist.x64.exe"
    "x86" = "https://aka.ms/vs/17/release/vc_redist.x86.exe"
}

$download_url = $vcredist_urls[$arch]
$temp_file = "$env:TEMP\vc_redist_$arch.exe"

Write-Host "⬇️ 下载 Visual C++ Redistributable..." -ForegroundColor Yellow
Write-Host "URL: $download_url" -ForegroundColor Gray

try {
    Invoke-WebRequest -Uri $download_url -OutFile $temp_file -UseBasicParsing
    Write-Host "✅ 下载完成" -ForegroundColor Green
    
    Write-Host "🔧 安装 Visual C++ Redistributable..." -ForegroundColor Yellow
    Write-Host "⚠️  可能需要管理员权限，请在弹出的窗口中确认安装" -ForegroundColor Yellow
    
    # 静默安装
    Start-Process -FilePath $temp_file -ArgumentList "/quiet", "/norestart" -Wait
    
    Write-Host "✅ Visual C++ Redistributable 安装完成" -ForegroundColor Green
    Write-Host "🔄 请重启计算机后再试" -ForegroundColor Cyan
    
    # 清理临时文件
    Remove-Item $temp_file -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ 下载失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 请手动下载并安装:" -ForegroundColor Yellow
    Write-Host "   $download_url" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 其他解决方案:" -ForegroundColor Cyan
Write-Host "1. 使用 start-mcp-no-leakless.bat 启动服务" -ForegroundColor White
Write-Host "2. 重启计算机后再试" -ForegroundColor White
Write-Host "3. 以管理员身份运行" -ForegroundColor White
