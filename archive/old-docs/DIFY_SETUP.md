# Dify AI 集成配置指南

## 1. 获取 Dify API 密钥

### 步骤 1：登录 Dify 控制台
访问您的Dify工作区：https://pro.aifunbox.com/app/8d9d5dea-7992-4e4f-b12c-de1126743ce2/develop

### 步骤 2：获取API密钥
1. 在工作区页面，点击右上角的「发布」按钮
2. 选择「API」选项卡
3. 复制「API密钥」

### 步骤 3：确认工作流配置
您的Dify工作流包含以下输入变量（必填项已标注）：
- `persona` - 学员人设
- `keywords` - 内容关键词
- `vision` - 愿景
- `user_input` - 今日主题
- `angle` - 分享角度 ⚠️必填
- `day_number` - 第几天打卡 ⚠️必填
- `sys.files` - 系统文件（LEGACY）
- `sys.user_id` - 系统用户ID
- `sys.app_id` - 系统应用ID
- `sys.workflow_id` - 系统工作流ID
- `sys.workflow_run_id` - 系统工作流运行ID

## 2. 配置环境变量

### 本地开发环境
在 `.env.local` 文件中设置：

```bash
# Dify Configuration (AI内容生成)
DIFY_API_URL=https://pro.aifunbox.com/v1/workflows/run
DIFY_API_KEY=您的API密钥
DIFY_WORKFLOW_ID=8d9d5dea-7992-4e4f-b12c-de1126743ce2
```

### Netlify 部署环境 ⚠️ 重要
**是的，您需要在Netlify环境变量中设置这些配置！**

1. 登录 Netlify 控制台
2. 进入项目设置
3. 点击「Environment Variables」
4. 添加以下变量：
   - `DIFY_API_URL`: `https://pro.aifunbox.com/v1/workflows/run`
   - `DIFY_API_KEY`: `您的真实API密钥`
   - `DIFY_WORKFLOW_ID`: `8d9d5dea-7992-4e4f-b12c-de1126743ce2`

## 3. API 集成详情

### 请求格式
```bash
curl -X POST 'https://pro.aifunbox.com/v1/workflows/run' \
--header 'Authorization: Bearer {您的API密钥}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "inputs": {
        "persona": "效率提升专家",
        "keywords": "AI工具,思维导图,效率",
        "vision": "成为AI领域的KOL",
        "user_input": "今天学会了用ChatGPT做思维导图",
        "angle": "efficiency",
        "day_number": 1
    },
    "response_mode": "blocking",
    "user": "AXCF2025040088"
}'
```

### 期望响应格式
根据您提供的工作流输出结构：
```json
{
  "data": {
    "titles": [
      {
        "id": 1,
        "content": "🚀 90天AI学习计划，从小白到高手的华丽转身！"
      }
    ],
    "bodies": [
      {
        "id": 1,
        "content": "正文内容..."
      }
    ],
    "hashtags": {
      "fixed": ["AI学习", "创富营"],
      "generated": ["ChatGPT", "思维导图"]
    },
    "visuals": {
      "images": [{"suggestion": "配图建议..."}],
      "videos": [{"suggestion": "视频建议..."}]
    }
  }
}
```

## 4. 功能特性

### ✅ 已实现
- Dify API 调用集成
- 智能内容格式转换
- 模拟数据降级方案
- 错误处理和用户反馈
- 环境变量配置管理

### 🔄 智能降级机制
- 如果 Dify API 未配置或调用失败，自动使用模拟数据
- 用户界面会显示当前使用的是模拟数据还是真实AI生成

### 📊 状态指示
- 生成成功时会显示数据源（Dify AI生成 或 模拟数据）
- 配置错误时会给出明确的提示信息

## 5. 测试验证

### 测试步骤
1. 配置正确的 `DIFY_API_URL` 和 `DIFY_API_KEY`
2. 访问 `/generate` 页面
3. 填写学号、学习主题和分享角度
4. 点击生成内容
5. 检查返回结果是否标注为 "Dify AI生成"

### 故障排除
- 如果显示"模拟数据"，检查环境变量配置
- 如果API调用失败，检查Dify工作流是否正常运行
- 查看浏览器控制台和服务端日志获取详细错误信息

## 6. 下一步计划

- [ ] 添加更多Dify响应格式支持
- [ ] 优化内容解析和格式化
- [ ] 增加API调用监控和分析
- [ ] 实现批量内容生成功能

---

**注意：** 请妥善保管您的Dify API密钥，不要在公开代码库中暴露。