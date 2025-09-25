-- 插入测试作业数据（使用建表脚本中已有的作业数据，这里只是确保数据存在）

-- 插入测试提交记录（使用正确的字段名，匹配建表脚本）
INSERT INTO submissions (
    submission_id,
    student_id,
    student_name,
    assignment_id,
    day_text,
    assignment_title,
    is_mandatory,
    description,
    status,
    feedback,
    "学号",
    "姓名",
    "第几天",
    "具体作业",
    "必做/选做",
    "作业详细要求",
    "学员提交的作业",
    "AI的作业评估"
) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'AXCF2025010019', '测试学员', 'd389d72a-34aa-405b-87c1-2ebfcf9cd66f', '第一周第一天', '小红书账号注册与设置', true, '注册小红书账号，完善个人资料，设置头像和简介', '合格', '完成质量良好，账号设置规范', 'AXCF2025010019', '测试学员', '第一周第一天', '小红书账号注册与设置', '必做', '注册小红书账号，完善个人资料，设置头像和简介', ARRAY['已完成账号注册，用户名：测试用户001，完善了个人资料'], '完成质量良好，账号设置规范'),

('660e8400-e29b-41d4-a716-446655440002', 'AXCF2025010019', '测试学员', 'ee995805-c5ef-4e88-9877-5cbfca5afd16', '第一周第一天', '平台规则学习', true, '学习小红书平台规则和社区公约', '合格', '规则理解到位，表现优秀', 'AXCF2025010019', '测试学员', '第一周第一天', '平台规则学习', '必做', '学习小红书平台规则和社区公约', ARRAY['已学习完成平台规则，总结了主要注意事项'], '规则理解到位，表现优秀'),

('660e8400-e29b-41d4-a716-446655440003', 'AXCF2025010019', '测试学员', '6f5db208-a4b6-4872-970b-e32a3ea6a971', '第一周第二天上午', '内容定位确定', true, '确定自己的内容定位和目标用户群体', '待批改', null, 'AXCF2025010019', '测试学员', '第一周第二天上午', '内容定位确定', '必做', '确定自己的内容定位和目标用户群体', ARRAY['确定了美食分享的内容定位，目标用户为年轻白领'], null);

-- 创建毕业要求表（如果不存在）
CREATE TABLE IF NOT EXISTS graduation_requirements (
    requirement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_name TEXT NOT NULL,
    required_count INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建学生毕业状态表（如果不存在）
CREATE TABLE IF NOT EXISTS student_graduation_status (
    student_id TEXT PRIMARY KEY,
    is_graduated BOOLEAN DEFAULT false,
    graduation_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入毕业要求数据
INSERT INTO graduation_requirements (requirement_id, requirement_name, required_count, description) VALUES
('770e8400-e29b-41d4-a716-446655440001', '必修作业完成', 20, '完成所有标记为必修的作业'),
('770e8400-e29b-41d4-a716-446655440002', '作业总数', 25, '总共完成至少25个作业'),
('770e8400-e29b-41d4-a716-446655440003', '合格作业数', 20, '至少20个作业状态为"合格"');

-- 插入学生毕业状态
INSERT INTO student_graduation_status (student_id, is_graduated, graduation_date, notes) VALUES
('AXCF2025010019', false, null, '正在学习中，已完成部分作业')
ON CONFLICT (student_id) DO UPDATE SET
    notes = EXCLUDED.notes,
    updated_at = NOW();