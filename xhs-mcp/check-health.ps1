# 健康检查脚本
try {
    $response = Invoke-WebRequest -Uri "http://localhost:18060/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ MCP服务运行正常" -ForegroundColor Green
    Write-Host "响应: $($response.StatusCode)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ MCP服务未运行或异常" -ForegroundColor Red
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Yellow
}
