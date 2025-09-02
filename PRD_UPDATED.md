# 小红书导航系统 - 更新需求文档

## 📋 项目概述

基于学员反馈和实际需求，重新调整项目功能，专注于核心的学员管理、打卡系统和作业管理功能。

## 🎯 核心功能需求

### A. 作业系统 (飞书集成)
- **功能描述**: 通过飞书链接方式实现作业提交和管理
- **实现方式**: 
  - 学员通过飞书链接提交作业
  - 管理员可以查看和管理作业状态
  - 支持作业评分和反馈

### B. 管理员功能
- **学员管理**:
  - 管理员登录后可新增学员
  - 输入字段：学员学号、昵称
  - 简化的学员管理界面
  - 不需要复杂的权限管理

### C. 学员资料系统
- **必填字段**:
  - 学号
  - 昵称  
  - **真实姓名** (新增必填项)
- **说明文案**: "真实姓名用于后续生成证书，不做他用，请如实填写"
- **验证**: 确保真实姓名字段不能为空

### D. 打卡系统优化
- **数据存储设计**:
  ```sql
  CREATE TABLE student_checkins (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    checkin_date DATE NOT NULL,
    xiaohongshu_link TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, checkin_date)
  );
  ```
- **功能要求**:
  - 学员每日上传小红书链接
  - 以上传时间为打卡时间
  - 存储完整的小红书链接
  - 支持同一天重复提交（覆盖）

### E. 打卡统计与日历展示
- **统计逻辑**:
  - 以小红书链接上传时间为准
  - 计算学员打卡合格率
  - 支持按月、按周查看
- **日历展示**:
  - 显示每日打卡状态
  - 区分已打卡/未打卡状态
  - 点击日期查看详细信息

### F. 日历界面设计
- **设计要求**:
  - 与系统日历同步
  - 美观炫酷的视觉效果
  - 动感的交互体验
  - 响应式设计
- **技术实现**:
  - 使用现代CSS动画
  - 支持移动端适配
  - 流畅的过渡效果

## 🗑️ 需要删除的功能

### 小红书抓取相关
- [ ] 删除 `app/search/page.tsx` 中的搜索功能
- [ ] 删除 `app/api/search/route.ts` 
- [ ] 删除 `xhs-service` 目录
- [ ] 删除小红书API相关配置

### 轮播功能
- [ ] 删除轮播组件
- [ ] 删除相关路由和页面

### 临时文件清理
- [ ] 删除 `temp-xhs-original/` 目录
- [ ] 删除 `COOKIE_GUIDE.md`
- [ ] 删除 `HONEST_STATUS_REPORT.md`
- [ ] 删除测试文件

## 📊 数据库设计

### 1. 学员表 (students) - 更新
```sql
ALTER TABLE students 
ADD COLUMN real_name VARCHAR(100) NOT NULL DEFAULT '';
```

### 2. 打卡表 (student_checkins) - 新建
```sql
CREATE TABLE student_checkins (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL REFERENCES students(student_id),
  checkin_date DATE NOT NULL,
  xiaohongshu_link TEXT NOT NULL,
  link_title VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, checkin_date)
);

CREATE INDEX idx_student_checkins_student_date 
ON student_checkins(student_id, checkin_date);

CREATE INDEX idx_student_checkins_date 
ON student_checkins(checkin_date);
```

### 3. 作业表 (assignments) - 保留现有
```sql
-- 保持现有结构，确保与飞书集成兼容
```

## 🎨 UI/UX 设计要求

### 日历组件
- **视觉风格**: 现代化、简洁
- **颜色方案**: 
  - 已打卡: 绿色渐变
  - 未打卡: 灰色
  - 今天: 蓝色高亮
- **动画效果**:
  - 悬停效果
  - 点击反馈
  - 加载动画

### 响应式设计
- 桌面端: 完整功能
- 平板端: 适配布局
- 移动端: 优化交互

## 🔧 技术实现计划

### 阶段1: 清理工作
1. 删除小红书抓取相关代码
2. 删除轮播功能
3. 清理临时文件和测试代码

### 阶段2: 数据库更新
1. 添加真实姓名字段
2. 创建打卡表
3. 更新数据库迁移脚本

### 阶段3: 功能实现
1. 更新学员资料表单
2. 实现打卡系统
3. 开发日历组件
4. 完善管理员功能

### 阶段4: 优化完善
1. 界面美化
2. 性能优化
3. 测试验证

## 📝 验收标准

### 功能验收
- [ ] 管理员可以新增学员
- [ ] 学员资料包含真实姓名必填项
- [ ] 学员可以提交小红书链接打卡
- [ ] 日历正确显示打卡状态
- [ ] 作业系统正常工作

### 性能验收
- [ ] 页面加载时间 < 2秒
- [ ] 日历交互流畅
- [ ] 移动端体验良好

### 安全验收
- [ ] 数据验证完整
- [ ] 权限控制正确
- [ ] 敏感信息保护

## 🚀 部署计划

1. **开发环境测试**: 在feature/xhs-bridge分支完成开发
2. **功能验证**: 确保所有功能正常工作
3. **代码审查**: 检查代码质量和安全性
4. **合并主分支**: 通过PR合并到主分支
5. **生产部署**: 部署到生产环境

## 📞 支持与维护

- 提供用户使用指南
- 建立问题反馈机制
- 定期功能更新和优化
