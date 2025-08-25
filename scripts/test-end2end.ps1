# 小红书导航器端到端测试脚本 (PowerShell版本)
# 测试搜索、打卡、登录等核心功能

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$StudentId = "test_student_001",
    [string]$Password = "test123456",
    [string]$Keyword = "美食"
)

# 配置
$ApiBaseUrl = "$BaseUrl/api"

# 测试计数器
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

# 日志函数
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 测试API端点
function Test-Api {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Data = "",
        [int]$ExpectedStatus,
        [string]$TestName
    )
    
    Write-Info "Testing: $TestName"
    
    try {
        $uri = "$ApiBaseUrl$Endpoint"
        $headers = @{ "Content-Type" = "application/json" }
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
            $statusCode = 200  # Invoke-RestMethod 成功时默认返回200
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $Data
            $statusCode = 200
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Success "$TestName - HTTP $statusCode"
            return $true
        } else {
            Write-Error "$TestName - Expected HTTP $ExpectedStatus, got $statusCode"
            return $false
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Success "$TestName - HTTP $statusCode (Expected error)"
            return $true
        } else {
            Write-Error "$TestName - Exception: $($_.Exception.Message)"
            return $false
        }
    }
}

# 运行测试
function Run-Test {
    param([scriptblock]$TestBlock)
    
    $script:TotalTests++
    if (& $TestBlock) {
        $script:PassedTests++
    } else {
        $script:FailedTests++
    }
    Write-Host ""
}

# 开始测试
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "小红书导航器 - 端到端测试 (PowerShell)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"
Write-Host "API Base URL: $ApiBaseUrl"
Write-Host "Test Student ID: $StudentId"
Write-Host "==================================================" -ForegroundColor Cyan

# 1. 测试健康检查
Write-Info "=== 1. 健康检查测试 ==="
Run-Test { Test-Api "GET" "/test" "" 200 "健康检查" }

# 2. 测试登录功能
Write-Info "=== 2. 登录功能测试 ==="
$loginData = @{
    action = "login"
    student_id = $StudentId
    password = $Password
} | ConvertTo-Json

Run-Test { Test-Api "POST" "/auth" $loginData 401 "登录测试（预期失败）" }

# 3. 测试关键词生成
Write-Info "=== 3. 关键词生成测试 ==="
$keywordsData = @{
    student_id = $StudentId
    theme_text = "今天分享一道超级好吃的家常菜，简单易做，营养丰富"
} | ConvertTo-Json

Run-Test { Test-Api "POST" "/keywords/generate" $keywordsData 200 "关键词生成" }

# 4. 测试搜索功能
Write-Info "=== 4. 搜索功能测试 ==="

# 测试基础搜索
$searchData = @{
    keyword = $Keyword
    page = 1
    page_size = 5
    sort = "general"
} | ConvertTo-Json

Run-Test { Test-Api "POST" "/search" $searchData 200 "基础搜索" }

# 测试关键词数组搜索
$searchArrayData = @{
    keywords = @($Keyword, "推荐")
    page = 1
    page_size = 3
    sort = "like"
} | ConvertTo-Json

Run-Test { Test-Api "POST" "/search" $searchArrayData 200 "关键词数组搜索" }

# 测试时间排序
$searchTimeData = @{
    keyword = $Keyword
    sort = "time"
    page_size = 3
} | ConvertTo-Json

Run-Test { Test-Api "POST" "/search" $searchTimeData 200 "时间排序搜索" }

# 5. 测试查看原文功能
Write-Info "=== 5. 查看原文功能测试 ==="
$viewData = @{
    note_id = "test_note_123"
    use_proxy = $false
} | ConvertTo-Json

Run-Test { Test-Api "POST" "/note/view" $viewData 200 "查看原文（二维码模式）" }

# 6. 测试打卡功能
Write-Info "=== 6. 打卡功能测试 ==="

# 测试打卡提交
$checkinData = @{
    student_id = $StudentId
    urls = @(
        "https://www.xiaohongshu.com/explore/test123",
        "https://www.xiaohongshu.com/explore/test456"
    )
} | ConvertTo-Json

Run-Test { Test-Api "POST" "/checkin/submit" $checkinData 200 "打卡提交" }

# 测试打卡历史查询
Run-Test { Test-Api "GET" "/checkin/submit?student_id=$StudentId&days=30" "" 200 "打卡历史查询" }

# 7. 测试退款资格检查
Write-Info "=== 7. 退款资格检查测试 ==="
Run-Test { Test-Api "GET" "/refund/eligibility?student_id=$StudentId&window_days=93" "" 200 "退款资格检查" }

# 8. 测试热门轮播
Write-Info "=== 8. 热门轮播测试 ==="
Run-Test { Test-Api "GET" "/hot-feed?days=7&limit=5" "" 200 "热门轮播" }

# 测试不同类型的热门内容
Run-Test { Test-Api "GET" "/hot-feed?type=student_viral&limit=3" "" 200 "学员爆款" }
Run-Test { Test-Api "GET" "/hot-feed?type=search_trending&limit=3" "" 200 "搜索热门" }

# 9. 测试错误处理
Write-Info "=== 9. 错误处理测试 ==="

# 测试缺少参数的情况
Run-Test { Test-Api "POST" "/search" "{}" 400 "搜索缺少参数" }

$invalidCheckinData = @{
    student_id = "test"
} | ConvertTo-Json
Run-Test { Test-Api "POST" "/checkin/submit" $invalidCheckinData 400 "打卡缺少URLs" }

$invalidKeywordsData = @{
    student_id = "test"
} | ConvertTo-Json
Run-Test { Test-Api "POST" "/keywords/generate" $invalidKeywordsData 400 "关键词生成缺少主题" }

# 10. 测试数据格式
Write-Info "=== 10. 数据格式测试 ==="

# 测试搜索返回数据格式
Write-Info "验证搜索API返回数据格式..."
try {
    $searchResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/search" -Method POST -Headers @{"Content-Type"="application/json"} -Body $searchData
    
    if ($searchResponse.success -eq $true -and 
        $searchResponse.data.notes -is [array] -and 
        $searchResponse.data.total_count -ne $null) {
        Write-Success "搜索API数据格式正确"
        $script:PassedTests++
    } else {
        Write-Error "搜索API数据格式不正确"
        $script:FailedTests++
    }
}
catch {
    Write-Error "搜索API数据格式验证失败: $($_.Exception.Message)"
    $script:FailedTests++
}
$script:TotalTests++

# 输出测试结果
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "测试完成" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "总测试数: $TotalTests"
Write-Host "通过: $PassedTests" -ForegroundColor Green
Write-Host "失败: $FailedTests" -ForegroundColor Red
$successRate = [math]::Round(($PassedTests / $TotalTests) * 100, 1)
Write-Host "成功率: $successRate%"
Write-Host "==================================================" -ForegroundColor Cyan

if ($FailedTests -eq 0) {
    Write-Success "所有测试通过！"
    exit 0
} else {
    Write-Error "有 $FailedTests 个测试失败"
    exit 1
}
