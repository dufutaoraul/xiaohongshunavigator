-- 作业系统数据库设置
-- 请在Supabase SQL编辑器中执行此脚本

-- 1. 创建作业表 (assignments)
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_text TEXT NOT NULL,
  assignment_title TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL,
  assignment_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建作业提交表 (submissions)
CREATE TABLE IF NOT EXISTS submissions (
  submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  student_name TEXT,
  assignment_id UUID REFERENCES assignments(assignment_id),
  day_text TEXT,
  assignment_title TEXT,
  is_mandatory BOOLEAN,
  description TEXT,
  attachments_url TEXT[] DEFAULT '{}',
  status TEXT DEFAULT '待批改' CHECK (status IN ('待批改', '批改中', '合格', '不合格', '批改失败')),
  feedback TEXT,
  graduation_status TEXT,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 中文字段名兼容
  "学号" TEXT,
  "姓名" TEXT,
  "第几天" TEXT,
  "具体作业" TEXT,
  "必做/选做" TEXT,
  "作业详细要求" TEXT,
  "学员提交的作业" TEXT[],
  "AI的作业评估" TEXT,
  "毕业合格统计" TEXT
);

-- 3. 插入示例作业数据
INSERT INTO assignments (assignment_id, day_text, assignment_title, is_mandatory, description, assignment_category) VALUES
-- 第一周第一天
('d389d72a-34aa-405b-87c1-2ebfcf9cd66f', '第一周第一天', '小红书账号注册与设置', true, '注册小红书账号，完善个人资料，设置头像和简介', '账号设置'),
('ee995805-c5ef-4e88-9877-5cbfca5afd16', '第一周第一天', '平台规则学习', true, '学习小红书平台规则和社区公约', '规则学习'),
('c4470efe-8e47-44fa-9e93-a8ffd843b471', '第一周第一天', '竞品分析', false, '分析同领域优秀博主的内容策略', '分析研究'),

-- 第一周第二天上午
('6f5db208-a4b6-4872-970b-e32a3ea6a971', '第一周第二天上午', '内容定位确定', true, '确定自己的内容定位和目标用户群体', '内容策划'),
('ecd889aa-8c70-44e0-9845-bfece36607ea', '第一周第二天上午', '关键词研究', true, '研究相关领域的热门关键词', '关键词优化'),

-- 第一周第二天下午
('4d594f12-eb0e-4f0b-84d3-3dd9862289b5', '第一周第二天下午', '首篇笔记发布', true, '发布第一篇小红书笔记', '内容创作'),
('187e771f-b7bd-46e9-a6fe-55811a3ea817', '第一周第二天下午', '封面设计练习', true, '学习并制作吸引人的封面图', '视觉设计'),
('1d0f4020-e65b-4242-9ac8-186797f89c39', '第一周第二天下午', '标题优化', false, '学习标题写作技巧并优化', '文案优化'),

-- 第一周第三天
('032f1a69-1d86-4fa7-b861-990a62d46119', '第一周第三天', '互动策略学习', true, '学习如何与粉丝互动，提高参与度', '用户运营'),
('0ae10a87-f31e-41b1-ba40-1ca3a29643ae', '第一周第三天', '数据分析基础', true, '学习分析笔记数据，了解用户喜好', '数据分析'),
('f20df2b1-3c6f-4588-953e-305f8f2f6e1e', '第一周第三天', '话题参与', false, '参与热门话题讨论，提高曝光', '话题营销'),

-- 第一周第四天
('0ce398ab-cffd-4d7f-8030-098885e11ada', '第一周第四天', '内容日历制作', true, '制作一周的内容发布计划', '内容规划'),
('355fb251-e389-4472-b3e1-a44e9183eb8c', '第一周第四天', '素材收集整理', true, '收集并整理创作素材库', '素材管理'),

-- 第一周第五天上午
('584a1f2f-79ef-45ed-b5e3-eed6727ad93d', '第一周第五天上午', '视频制作入门', true, '学习制作简单的视频内容', '视频制作'),
('09cf0e55-edee-4918-a7ee-c0ca80634798', '第一周第五天上午', '拍摄技巧学习', true, '学习基础的拍摄构图技巧', '拍摄技能'),
('e8d8d55e-53b3-4553-a47e-285cb8fca8da', '第一周第五天上午', '剪辑软件使用', false, '学习使用剪辑软件制作内容', '技能学习'),

-- 第一周第五天下午
('01905238-0d9f-44af-a9e7-7a1a436d9ae2', '第一周第五天下午', '品牌合作了解', true, '了解品牌合作的基本流程', '商业合作'),
('b80930ca-79e1-4060-b7e1-db68e02a26a2', '第一周第五天下午', '变现方式学习', true, '学习小红书的各种变现方式', '变现策略'),
('65ad4933-8887-4ece-a8b6-d821ba513b52', '第一周第五天下午', '法律风险防范', false, '了解内容创作的法律风险', '法律知识'),

-- 第一周第六天
('ff4c7a7c-42dc-480c-9ae8-28070d0c7bff', '第一周第六天', '周总结与反思', true, '总结第一周的学习成果和不足', '总结反思'),

-- 第一周第七天上午
('93617ee2-5ee5-4223-903d-344342d7e864', '第一周第七天上午', '粉丝增长策略', true, '学习有效的粉丝增长方法', '粉丝运营'),
('39fa3ab0-6b2c-4a8c-a3ae-58f38163366c', '第一周第七天上午', 'SEO优化技巧', false, '学习小红书内容的SEO优化', 'SEO优化'),

-- 第一周第七天下午
('ee239a59-996e-4f7b-a9bc-e29939771158', '第一周第七天下午', '社群运营基础', true, '学习社群运营的基本方法', '社群运营'),
('24258968-2872-4840-a74e-0227b533712c', '第一周第七天下午', '危机公关处理', false, '学习处理负面评论和危机', '危机管理'),

-- 第二周第一天上午
('dcfcafd0-84fc-4c3b-a5cb-da9a56e29655', '第二周第一天上午', '高级内容策划', true, '学习更高级的内容策划技巧', '内容策划'),
('c4fe101a-83e4-4af5-8af6-94876a244664', '第二周第一天上午', '用户画像分析', true, '深入分析目标用户画像', '用户分析'),

-- 第二周第一天下午
('c8c0cf86-fca0-4a17-a2cd-31dad299922e', '第二周第一天下午', '内容矩阵搭建', true, '搭建多平台内容分发矩阵', '矩阵运营'),
('5f8aa7ac-7eb7-490a-8180-c61fb9ac9efd', '第二周第一天下午', '跨平台运营', false, '学习多平台联动运营策略', '平台运营'),

-- 第二周第二天
('3a13c383-5a97-453b-80c4-5cdd370b5145', '第二周第二天', '直播带货入门', true, '学习直播带货的基本技巧', '直播运营'),
('5fe9e41f-5098-488d-a8e7-aa84496bca87', '第二周第二天', '产品选择策略', true, '学习如何选择合适的产品', '产品运营'),

-- 第二周第三天
('6cefb71c-3f71-4af9-9e8d-de86dc63087e', '第二周第三天', '数据驱动优化', true, '基于数据分析优化内容策略', '数据分析'),
('023e6d26-0c42-4d6b-9dcb-3e5e6ee1d764', '第二周第三天', 'A/B测试实践', false, '进行内容A/B测试实验', '测试优化'),

-- 第二周第四天
('080120bd-2058-43c0-8cea-45f6b61146ac', '第二周第四天', '团队协作管理', true, '学习团队协作和任务管理', '团队管理'),
('82c64a57-1e82-4b27-befa-16f07c6ad643', '第二周第四天', '外包管理技巧', false, '学习如何管理外包团队', '外包管理'),

-- 第二周第五天
('c4dea7d7-9b70-44d3-bfc2-e69110dc3572', '第二周第五天', '商业计划制定', true, '制定个人IP的商业发展计划', '商业规划'),
('5a428fa0-5721-4541-8aea-c08477eff30d', '第二周第五天', '投资回报分析', true, '分析内容创作的投资回报率', '财务分析'),
('4ea2ff4a-c838-48c6-911d-2673137bca52', '第二周第五天', '税务筹划基础', false, '了解个人IP的税务筹划', '税务知识'),

-- 第二周第六天
('03a959e7-48ba-4b6a-bcb9-8957bcaa18fe', '第二周第六天', '毕业作品制作', true, '制作毕业展示作品', '毕业项目'),
('a853efbf-fe9e-41d2-9a4c-3d24850cd205', '第二周第六天', '未来规划制定', true, '制定未来发展规划和目标', '规划总结');

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_assignments_day_text ON assignments(day_text);

-- 5. 启用行级安全策略 (RLS)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 6. 创建安全策略
-- 所有用户都可以查看作业
CREATE POLICY "Anyone can view assignments" ON assignments FOR SELECT USING (true);

-- 用户只能查看自己的提交记录
CREATE POLICY "Users can view own submissions" ON submissions FOR SELECT USING (
  student_id = current_setting('request.jwt.claims', true)::json->>'student_id' OR
  "学号" = current_setting('request.jwt.claims', true)::json->>'student_id'
);

-- 用户可以插入自己的提交记录
CREATE POLICY "Users can insert own submissions" ON submissions FOR INSERT WITH CHECK (
  student_id = current_setting('request.jwt.claims', true)::json->>'student_id' OR
  "学号" = current_setting('request.jwt.claims', true)::json->>'student_id'
);

-- 用户可以更新自己的提交记录
CREATE POLICY "Users can update own submissions" ON submissions FOR UPDATE USING (
  student_id = current_setting('request.jwt.claims', true)::json->>'student_id' OR
  "学号" = current_setting('request.jwt.claims', true)::json->>'student_id'
);

-- 管理员可以查看和修改所有数据
CREATE POLICY "Admins can do everything on assignments" ON assignments FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

CREATE POLICY "Admins can do everything on submissions" ON submissions FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

COMMENT ON TABLE assignments IS '作业表 - 存储所有课程作业信息';
COMMENT ON TABLE submissions IS '作业提交表 - 存储学员作业提交记录';