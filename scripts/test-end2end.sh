#!/bin/bash

# 小红书导航器端到端测试脚本
# 测试搜索、打卡、登录等核心功能

set -e  # 遇到错误立即退出

# 配置
BASE_URL="http://localhost:3000"
API_BASE_URL="$BASE_URL/api"
TEST_STUDENT_ID="test_student_001"
TEST_PASSWORD="test123456"
TEST_KEYWORD="美食"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查HTTP响应状态
check_response() {
    local response="$1"
    local expected_status="$2"
    local test_name="$3"
    
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if [ "$status" = "$expected_status" ]; then
        log_success "$test_name - HTTP $status"
        echo "$body"
        return 0
    else
        log_error "$test_name - Expected HTTP $expected_status, got $status"
        echo "$body"
        return 1
    fi
}

# 测试API端点
test_api() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    local test_name="$5"
    
    log_info "Testing: $test_name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    fi
    
    if check_response "$response" "$expected_status" "$test_name"; then
        return 0
    else
        return 1
    fi
}

# 开始测试
echo "=================================================="
echo "小红书导航器 - 端到端测试"
echo "=================================================="
echo "Base URL: $BASE_URL"
echo "API Base URL: $API_BASE_URL"
echo "Test Student ID: $TEST_STUDENT_ID"
echo "=================================================="

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if "$@"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# 1. 测试健康检查
log_info "=== 1. 健康检查测试 ==="
run_test test_api "GET" "/test" "" "200" "健康检查"

# 2. 测试登录功能
log_info "=== 2. 登录功能测试 ==="

# 测试登录（可能失败，因为测试用户可能不存在）
login_data="{\"action\":\"login\",\"student_id\":\"$TEST_STUDENT_ID\",\"password\":\"$TEST_PASSWORD\"}"
run_test test_api "POST" "/auth" "$login_data" "401" "登录测试（预期失败）"

# 3. 测试关键词生成
log_info "=== 3. 关键词生成测试 ==="
keywords_data="{\"student_id\":\"$TEST_STUDENT_ID\",\"theme_text\":\"今天分享一道超级好吃的家常菜，简单易做，营养丰富\"}"
run_test test_api "POST" "/keywords/generate" "$keywords_data" "200" "关键词生成"

# 4. 测试搜索功能
log_info "=== 4. 搜索功能测试 ==="

# 测试基础搜索
search_data="{\"keyword\":\"$TEST_KEYWORD\",\"page\":1,\"page_size\":5,\"sort\":\"general\"}"
run_test test_api "POST" "/search" "$search_data" "200" "基础搜索"

# 测试关键词数组搜索
search_array_data="{\"keywords\":[\"$TEST_KEYWORD\",\"推荐\"],\"page\":1,\"page_size\":3,\"sort\":\"like\"}"
run_test test_api "POST" "/search" "$search_array_data" "200" "关键词数组搜索"

# 测试时间排序
search_time_data="{\"keyword\":\"$TEST_KEYWORD\",\"sort\":\"time\",\"page_size\":3}"
run_test test_api "POST" "/search" "$search_time_data" "200" "时间排序搜索"

# 5. 测试查看原文功能
log_info "=== 5. 查看原文功能测试 ==="
view_data="{\"note_id\":\"test_note_123\",\"use_proxy\":false}"
run_test test_api "POST" "/note/view" "$view_data" "200" "查看原文（二维码模式）"

# 6. 测试打卡功能
log_info "=== 6. 打卡功能测试 ==="

# 测试打卡提交
checkin_data="{\"student_id\":\"$TEST_STUDENT_ID\",\"urls\":[\"https://www.xiaohongshu.com/explore/test123\",\"https://www.xiaohongshu.com/explore/test456\"]}"
run_test test_api "POST" "/checkin/submit" "$checkin_data" "200" "打卡提交"

# 测试打卡历史查询
run_test test_api "GET" "/checkin/submit?student_id=$TEST_STUDENT_ID&days=30" "" "200" "打卡历史查询"

# 7. 测试退款资格检查
log_info "=== 7. 退款资格检查测试 ==="
run_test test_api "GET" "/refund/eligibility?student_id=$TEST_STUDENT_ID&window_days=93" "" "200" "退款资格检查"

# 8. 测试热门轮播
log_info "=== 8. 热门轮播测试 ==="
run_test test_api "GET" "/hot-feed?days=7&limit=5" "" "200" "热门轮播"

# 测试不同类型的热门内容
run_test test_api "GET" "/hot-feed?type=student_viral&limit=3" "" "200" "学员爆款"
run_test test_api "GET" "/hot-feed?type=search_trending&limit=3" "" "200" "搜索热门"

# 9. 测试错误处理
log_info "=== 9. 错误处理测试 ==="

# 测试缺少参数的情况
run_test test_api "POST" "/search" "{}" "400" "搜索缺少参数"
run_test test_api "POST" "/checkin/submit" "{\"student_id\":\"test\"}" "400" "打卡缺少URLs"
run_test test_api "POST" "/keywords/generate" "{\"student_id\":\"test\"}" "400" "关键词生成缺少主题"

# 10. 测试数据格式
log_info "=== 10. 数据格式测试 ==="

# 测试搜索返回数据格式
log_info "验证搜索API返回数据格式..."
search_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$search_data" \
    "$API_BASE_URL/search")

if echo "$search_response" | grep -q '"success".*true' && \
   echo "$search_response" | grep -q '"notes".*\[' && \
   echo "$search_response" | grep -q '"total_count"'; then
    log_success "搜索API数据格式正确"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_error "搜索API数据格式不正确"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 输出测试结果
echo "=================================================="
echo "测试完成"
echo "=================================================="
echo "总测试数: $TOTAL_TESTS"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
echo "成功率: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo "=================================================="

if [ $FAILED_TESTS -eq 0 ]; then
    log_success "所有测试通过！"
    exit 0
else
    log_error "有 $FAILED_TESTS 个测试失败"
    exit 1
fi
