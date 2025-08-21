# 小红书爬虫Cookie配置指南

## 功能概述

小红书爬虫系统现已支持Cookie认证，可以获取真实的小红书数据。如果不配置Cookie，系统将返回演示数据。

## Cookie获取步骤

### 1. 登录小红书网页版
- 在浏览器中访问 [www.xiaohongshu.com](https://www.xiaohongshu.com)
- 使用您的账号登录

### 2. 打开开发者工具
- 按 `F12` 键或右键选择"检查"
- 切换到 `Network`（网络）标签页

### 3. 获取Cookie
- 在小红书页面进行搜索或刷新页面
- 在Network标签页中找到任意一个请求
- 点击请求，查看 `Request Headers`（请求头）
- 找到 `Cookie` 字段，复制完整的Cookie值

### 4. 配置Cookie
- 打开测试页面：http://localhost:3001/test-xhs-api.html
- 在"Cookie配置"区域粘贴获取的Cookie字符串
- 进行搜索测试

## API使用方式

### 带Cookie的搜索请求

```javascript
// POST方式
fetch('/api/xhs/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        action: 'search',
        keyword: '美食',
        page: 1,
        pageSize: 10,
        cookies: '你的Cookie字符串'
    })
})
```

### GET方式（URL参数）

```
GET /api/xhs/test?action=search&keyword=美食&page=1&pageSize=10&cookies=你的Cookie字符串
```

## 返回数据格式

### 成功响应（真实数据）
```json
{
    "message": "搜索成功",
    "keyword": "美食",
    "page": 1,
    "page_size": 10,
    "status": "success",
    "total_count": 5,
    "notes": [
        {
            "note_id": "实际笔记ID",
            "title": "实际笔记标题",
            "desc": "实际笔记描述",
            "type": "normal",
            "user": {
                "nickname": "实际用户昵称",
                "user_id": "实际用户ID"
            },
            "interact_info": {
                "liked_count": "实际点赞数",
                "comment_count": "实际评论数",
                "collected_count": "实际收藏数"
            },
            "cover": "封面图片URL"
        }
    ]
}
```

### 演示数据响应（无Cookie）
```json
{
    "message": "XHS库已加载，但需要配置Cookie才能进行实际搜索",
    "keyword": "美食",
    "status": "需要配置",
    "notes": [
        {
            "note_id": "demo_001",
            "title": "关于'美食'的示例笔记1",
            "desc": "这是一个示例笔记...",
            "type": "normal"
        }
    ],
    "cookie_guide": {
        "steps": ["获取Cookie的详细步骤..."],
        "example_usage": "API使用示例"
    }
}
```

## 注意事项

1. **Cookie有效期**：Cookie会过期，需要定期更新
2. **账号安全**：请妥善保管Cookie，不要泄露给他人
3. **请求频率**：避免过于频繁的请求，以免被限制访问
4. **数据合规**：请遵守小红书的使用条款和相关法律法规

## 故障排除

### Cookie无效
- 检查Cookie是否完整复制
- 确认小红书账号仍处于登录状态
- 重新获取最新的Cookie

### 搜索失败
- 检查网络连接
- 确认关键词格式正确
- 查看API返回的错误信息

### 返回演示数据
- 确认已正确配置Cookie
- 检查Cookie格式是否正确
- 验证Cookie是否仍然有效

## 技术架构

- **前端**：Next.js 15.4.6 + TypeScript
- **后端**：Python + XhsClient库
- **爬虫库**：ReaJason/xhs (Git子模块)
- **通信方式**：Node.js child_process.spawn()

## 相关文件

- `services/xhs_bridge/main.py` - Python爬虫核心
- `app/api/xhs/test/route.ts` - Next.js API路由
- `public/test-xhs-api.html` - 可视化测试界面
- `xhs-service/` - XHS库子模块

## 更新日志

- ✅ 添加Cookie配置支持
- ✅ 支持真实数据获取
- ✅ 增强错误处理
- ✅ 改进测试界面
- ✅ 完善API文档

现在您可以通过配置Cookie来获取真实的小红书数据了！