# AI批改系统配置指南

## 🤖 AI服务后备方案

本系统集成了多个AI服务，提供智能后备机制：

1. **Gemini API** (Google) - 支持图片分析，优先使用
2. **DeepSeek API** - 文本批改，作为后备  
3. **智能后备** - 基于规则的智能判断

## 🔧 环境变量配置

### Vercel/Netlify部署配置

在部署平台的Environment Variables中添加以下配置：

#### 腾讯云COS存储（必需）
```bash
TENCENT_SECRET_ID=你的腾讯云SecretId
TENCENT_SECRET_KEY=你的腾讯云SecretKey  
TENCENT_COS_REGION=ap-guangzhou
TENCENT_COS_BUCKET=pigaizuoye-1328156262
```

#### Gemini API（可选 - 推荐）
```bash
GEMINI_API_KEY=你的Gemini_API_Key
GEMINI_API_URL=https://generativelanguage.googleapis.com
GEMINI_MODEL_ID=gemini-1.5-flash
```

#### DeepSeek API（可选）  
```bash
DEEPSEEK_API_KEY=你的DeepSeek_API_Key
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL_ID=deepseek-chat
```

## 🎯 AI批改工作流程

### 1. 优先级顺序
1. **Gemini API** - 如果配置了API密钥，优先使用（支持图片分析）
2. **DeepSeek API** - 如果Gemini失败，使用DeepSeek文本批改
3. **智能后备** - 如果所有AI服务都不可用，使用基于规则的智能判断

### 2. 批改逻辑
- **图片分析**: Gemini可直接分析学员上传的图片内容
- **文本批改**: DeepSeek基于作业要求和提交情况进行判断  
- **智能后备**: 基于作业特征（截图类、复杂度等）智能评分

### 3. 结果格式
```typescript
interface AIGradingResult {
  status: '合格' | '不合格';
  feedback: string;
}
```

## 🚀 快速部署

### 最小配置（仅腾讯云COS）
如果不配置AI API，系统会使用智能后备方案，通过率约80%：

```bash
TENCENT_SECRET_ID=你的SecretId
TENCENT_SECRET_KEY=你的SecretKey
TENCENT_COS_REGION=ap-guangzhou  
TENCENT_COS_BUCKET=pigaizuoye-1328156262
```

### 推荐配置（添加Gemini）
获得最佳AI批改体验：

```bash
# 腾讯云COS（文件存储）
TENCENT_SECRET_ID=你的SecretId
TENCENT_SECRET_KEY=你的SecretKey
TENCENT_COS_REGION=ap-guangzhou
TENCENT_COS_BUCKET=pigaizuoye-1328156262

# Gemini API（图片分析）
GEMINI_API_KEY=你的Gemini_Key
GEMINI_API_URL=https://generativelanguage.googleapis.com
```

## 📋 获取API密钥

### Gemini API密钥
1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建API密钥
3. 复制密钥到环境变量

### DeepSeek API密钥  
1. 访问 [DeepSeek开放平台](https://platform.deepseek.com/)
2. 注册账号并创建API密钥
3. 复制密钥到环境变量

### 腾讯云COS密钥
1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 访问管理 → API密钥管理
3. 创建密钥并复制SecretId和SecretKey

## ⚡ 性能优化

- **超时控制**: Gemini 2分钟，DeepSeek 30秒
- **快速失败**: AI服务不可用时快速回退到后备方案
- **智能缓存**: 相同作业类型的批改经验会影响智能后备判断

## 🔒 安全注意事项

1. **绝不要**将API密钥提交到代码仓库
2. **只在**部署平台环境变量中配置密钥
3. **定期轮换**API密钥确保安全
4. **监控**API使用量避免超额费用

## 📊 监控和日志

系统会在控制台输出详细日志：
- 🚀 AI批改流程开始
- 🔥 使用Gemini API进行图片批改  
- 🔄 回退到DeepSeek文本批改
- 🛡️ 使用智能后备批改方案
- ✅ 批改成功 / ❌ 批改失败

通过日志可以监控AI服务使用情况和成功率。