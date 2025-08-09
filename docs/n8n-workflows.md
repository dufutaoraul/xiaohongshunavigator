# N8N 工作流配置指南

本文档描述了小红书AI灵感领航员项目所需的N8N工作流配置。

## 1. 内容生成工作流 (Content Generation Workflow)

### Webhook URL
- 环境变量：`N8N_WEBHOOK_URL_GENERATE`
- 请求方法：POST

### 输入数据结构
```json
{
  "student_id": "AXCF2025040088",
  "user_input": "今天学会了用ChatGPT做思维导图，效率提升了3倍",
  "angle": "efficiency",
  "user_data": {
    "persona": "专注AI变现的90后宝妈创业者",
    "keywords": "AI工具使用,副业赚钱,时间管理",
    "vision": "成为AI变现领域的KOL，粉丝过万，月收入过万"
  }
}
```

### 工作流步骤
1. **接收Webhook请求**
2. **提取用户数据**：从user_data中获取persona、keywords、vision
3. **调用Dify工作流**：
   ```
   POST https://api.dify.ai/v1/workflows/run
   Headers:
   - Authorization: Bearer {DIFY_API_KEY}
   - Content-Type: application/json
   
   Body:
   {
     "inputs": {
       "persona": "...",
       "keywords": "...", 
       "vision": "...",
       "user_input": "...",
       "angle": "..."
     },
     "user": "{student_id}"
   }
   ```
4. **处理Dify响应**：提取生成的内容和视觉建议
5. **返回结果**：
   ```json
   {
     "content": "生成的小红书文案内容",
     "visual_suggestions": "配图和视频建议"
   }
   ```

## 2. 打卡工作流 (Punch Card Workflow)

### Webhook URL
- 环境变量：`N8N_WEBHOOK_URL_PUNCH`
- 请求方法：POST

### 输入数据结构
```json
{
  "student_id": "AXCF2025040088",
  "post_url": "https://www.xiaohongshu.com/explore/...",
  "user_id": "uuid-string"
}
```

### 工作流步骤
1. **接收Webhook请求**
2. **URL验证**：验证小红书链接格式
3. **数据抓取**（V2功能）：
   - 调用第三方数据抓取API
   - 获取帖子的点赞数、评论数、收藏数
   - 获取帖子真实发布时间
4. **数据处理**：格式化抓取到的数据
5. **返回结果**：
   ```json
   {
     "success": true,
     "post_data": {
       "created_at": "2025-01-15T10:30:00.000Z",
       "likes": 156,
       "comments": 23,
       "collections": 45
     }
   }
   ```

## 3. Dify工作流设计

### 工作流名称：小红书内容生成器

### 输入变量
- `persona` (string): 用户人设定位
- `keywords` (string): 内容关键词（逗号分隔）
- `vision` (string): 90天愿景
- `user_input` (string): 用户输入的学习主题
- `angle` (string): 分享角度

### 工作流步骤
1. **内容生成节点**：
   - 使用大模型（如GPT-4）
   - Prompt模板：
   ```
   你是一位专业的小红书内容创作专家。请基于以下信息生成一篇小红书帖子：

   用户人设：{{persona}}
   内容关键词：{{keywords}}
   90天愿景：{{vision}}
   今日主题：{{user_input}}
   分享角度：{{angle}}

   请生成一篇符合小红书风格的帖子，包含：
   1. 吸引人的开头
   2. 3-5个要点
   3. 实用的建议
   4. 相关话题标签
   5. 互动引导

   字数控制在200-300字。
   ```

2. **视觉建议节点**：
   - 基于生成的内容和分享角度
   - 提供具体的配图和视频建议
   - Prompt模板：
   ```
   基于以下小红书内容，请提供具体的视觉设计建议：

   内容：{{generated_content}}
   分享角度：{{angle}}

   请提供：
   1. 配图建议（3-5张图的具体描述）
   2. 视频建议（如果适用）
   3. 视觉风格建议
   4. 色彩搭配建议
   ```

### 输出格式
```json
{
  "content": "生成的文案内容",
  "visual_suggestions": "视觉建议内容"
}
```

## 4. 环境变量配置

在N8N中设置以下环境变量：
- `DIFY_API_URL`: Dify API地址
- `DIFY_API_KEY`: Dify API密钥
- `SUPABASE_URL`: Supabase项目URL
- `SUPABASE_KEY`: Supabase服务密钥

## 5. 错误处理

所有工作流都应包含错误处理机制：
1. **超时处理**：设置合理的超时时间
2. **重试机制**：对于网络错误进行重试
3. **降级方案**：当外部服务不可用时的备用方案
4. **日志记录**：记录所有请求和响应用于调试

## 6. 部署注意事项

1. 确保N8N实例可以访问外部API
2. 配置正确的Webhook URL
3. 测试所有工作流的完整流程
4. 监控工作流的执行状态和性能