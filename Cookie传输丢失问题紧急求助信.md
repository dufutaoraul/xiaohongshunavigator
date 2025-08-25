# Cookie传输丢失问题紧急求助信

## 🚨 问题描述

我们遇到了一个非常奇怪的问题：**前端明确发送了Cookie，但后端接收到的是None**。这个问题让我们困惑不已，需要其他AI的帮助来排查。

## 📊 问题证据

### 前端发送证据（浏览器Console）
```javascript
🔍 [DEBUG] localStorage中的Cookie: abRequestId=439a8b17-1b61-5307-87ed-efec8a2a6624...
🍪 使用保存的Cookie: abRequestId=439a8b17-1b61-5307-87ed-efec8a2a6624...
📤 [DEBUG] 发送的请求体: 
  cookie: "abRequestId=439a8b17-1b61-5307-87ed-efec8a2a6624; ..."
```

### 后端接收证据（FastAPI终端）
```python
🍪 [DEBUG] 前端传入的Cookie: None
```

### 网络请求证据（Network面板）
```json
{
  "keyword": "美食",
  "page": 1,
  "page_size": 10,
  "sort": "general",
  "cookie": "abRequestId=439a8b17-1b61-5307-87ed-efec8a2a6624; ..."
}
```

## 🔍 技术细节

### 前端代码（app/search/page.tsx）
```typescript
const savedCookie = localStorage.getItem('xhs_cookie')
console.log('🔍 [DEBUG] localStorage中的Cookie:', savedCookie ? `${savedCookie.substring(0, 50)}...` : 'null')

const requestBody = {
  keyword: keyword.trim(),
  page,
  page_size: 10,
  sort,
  cookie: savedCookie  // ← 这里确实有Cookie
}
console.log('📤 [DEBUG] 发送的请求体:', { ...requestBody, cookie: requestBody.cookie ? `${requestBody.cookie.substring(0, 50)}...` : 'null' })

const response = await fetch('http://localhost:8002/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody)
})
```

### 后端代码（xhs-service/fastapi-service/app.py）
```python
class SearchRequest(BaseModel):
    keyword: str
    page: int = 1
    page_size: int = 10
    sort: str = 'general'
    cookie: Optional[str] = None  # ← 字段名已经统一

@app.post("/search")
async def search_notes(request: SearchRequest):
    print(f"🍪 [DEBUG] 前端传入的Cookie: {request.cookie}")  # ← 这里显示None
```

## 🤔 奇怪的现象

1. **前端日志显示**：Cookie存在且正确发送
2. **网络面板显示**：请求体包含Cookie字段
3. **后端日志显示**：接收到的Cookie为None
4. **之前版本工作正常**：同样的逻辑在之前版本中是正常的

## 📋 已尝试的解决方案

1. ✅ **字段名统一**：确保前后端都使用`cookie`（单数）
2. ✅ **Pydantic模型检查**：确认字段类型为`Optional[str]`
3. ✅ **CORS配置**：FastAPI已正确配置CORS
4. ✅ **请求格式**：使用POST + JSON格式
5. ✅ **调试日志**：添加了详细的前后端日志

## 🔍 需要排查的方向

### 可能的问题点
1. **JSON序列化问题**：Cookie字符串在序列化时被截断或损坏？
2. **FastAPI解析问题**：Pydantic模型解析JSON时丢失Cookie字段？
3. **网络传输问题**：Cookie在HTTP传输过程中被过滤？
4. **字符编码问题**：Cookie包含特殊字符导致解析失败？
5. **请求体大小限制**：Cookie太长被截断？

### 需要验证的点
1. **原始请求体**：FastAPI是否收到了完整的JSON请求体？
2. **Pydantic解析**：模型解析过程中是否有错误？
3. **Cookie格式**：当前Cookie格式是否符合预期？
4. **成功版本对比**：成功版本和当前版本的具体差异？

## 🆘 请求协助

需要其他AI帮助：

1. **定位Cookie丢失的确切位置**：
   - 是在JSON序列化时丢失？
   - 是在HTTP传输时丢失？
   - 是在FastAPI解析时丢失？

2. **提供调试方案**：
   - 如何在FastAPI中打印原始请求体？
   - 如何验证Pydantic模型解析过程？
   - 如何对比成功版本和失败版本？

3. **修复建议**：
   - 基于问题根因提供具体的修复方案
   - 确保修复后能正常获取真实小红书数据

## 📁 相关文件

- `app/search/page.tsx` - 前端搜索页面
- `xhs-service/fastapi-service/app.py` - 后端API服务
- `app/test-simple/page-v1.0-working.tsx` - 之前的成功版本

## ⏰ 紧急程度

**最高优先级** - 这个问题阻塞了整个项目的核心功能，用户无法获取真实的小红书数据。

## 💡 关键疑问

**为什么前端明确发送了Cookie，但后端接收到的是None？这个Cookie到底在哪个环节丢失了？**

---

**创建时间**：2025年8月24日 23:15  
**问题状态**：紧急待解决  
**影响范围**：核心搜索功能完全失效