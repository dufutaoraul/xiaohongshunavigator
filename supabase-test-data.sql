-- 插入测试作业数据
INSERT INTO assignments (assignment_id, assignment_title, day_text, is_mandatory, description) VALUES
('hw001', '小红书账号注册与基础设置', '第一周第一天上午', true, '注册小红书账号，完善个人资料，了解平台基本功能'),
('hw002', '竞品分析与定位', '第一周第一天下午', true, '分析同领域优秀账号，确定自己的内容定位'),
('hw003', '内容创作工具准备', '第一周第二天上午', false, '准备内容创作所需的工具和素材'),
('hw004', '第一篇笔记发布', '第一周第二天下午', true, '发布第一篇小红书笔记，实践内容创作'),
('hw005', '数据分析与优化', '第一周第三天上午', true, '分析第一篇笔记的数据表现，总结经验'),
('hw006', '社群互动练习', '第一周第三天下午', false, '主动与其他用户互动，建立社群关系'),
('hw007', '内容规划制定', '第一周第四天上午', true, '制定未来一周的内容发布计划'),
('hw008', '品牌形象设计', '第一周第四天下午', false, '设计个人品牌形象，包括头像、简介等'),
('hw009', '热点追踪与应用', '第一周第五天上午', true, '学会追踪热点话题，并应用到内容创作中'),
('hw010', '周总结与反思', '第一周第五天下午', true, '总结第一周的学习成果和经验教训');

-- 插入测试提交记录（为学号 AXCF2025010019 创建一些提交记录）
INSERT INTO submissions (
    submission_id, 
    student_id, 
    assignment_id, 
    assignment_title, 
    day_text, 
    is_mandatory, 
    description, 
    attachments_url, 
    submission_date, 
    status, 
    feedback
) VALUES
('sub001', 'AXCF2025010019', 'hw001', '小红书账号注册与基础设置', '第一周第一天上午', true, '注册小红书账号，完善个人资料', 
 ARRAY['https://example.com/screenshot1.jpg', 'https://example.com/screenshot2.jpg'], 
 '2024-01-15 10:30:00', '合格', '账号设置完成良好，个人资料信息完整，符合要求。'),

('sub002', 'AXCF2025010019', 'hw002', '竞品分析与定位', '第一周第一天下午', true, '分析同领域优秀账号，确定内容定位', 
 ARRAY['https://example.com/analysis1.jpg', 'https://example.com/analysis2.jpg'], 
 '2024-01-15 16:45:00', '合格', '竞品分析深入，定位清晰，有自己的思考和见解。'),

('sub003', 'AXCF2025010019', 'hw004', '第一篇笔记发布', '第一周第二天下午', true, '发布第一篇小红书笔记', 
 ARRAY['https://example.com/note1.jpg'], 
 '2024-01-16 15:20:00', '待批改', NULL),

('sub004', 'AXCF2025010019', 'hw005', '数据分析与优化', '第一周第三天上午', true, '分析笔记数据表现', 
 ARRAY['https://example.com/data1.jpg', 'https://example.com/data2.jpg'], 
 '2024-01-17 11:10:00', '不合格', '数据分析不够深入，需要更详细的分析和改进建议。'),

('sub005', 'AXCF2025010019', 'hw007', '内容规划制定', '第一周第四天上午', true, '制定内容发布计划', 
 ARRAY['https://example.com/plan1.jpg'], 
 '2024-01-18 09:30:00', '合格', '内容规划合理，时间安排得当，执行性强。');

-- 插入更多学生的测试数据
INSERT INTO submissions (
    submission_id, 
    student_id, 
    assignment_id, 
    assignment_title, 
    day_text, 
    is_mandatory, 
    description, 
    attachments_url, 
    submission_date, 
    status, 
    feedback
) VALUES
('sub006', 'AXCF2025010020', 'hw001', '小红书账号注册与基础设置', '第一周第一天上午', true, '注册小红书账号，完善个人资料', 
 ARRAY['https://example.com/user2_screenshot1.jpg'], 
 '2024-01-15 11:00:00', '合格', '完成良好。'),

('sub007', 'AXCF2025010021', 'hw001', '小红书账号注册与基础设置', '第一周第一天上午', true, '注册小红书账号，完善个人资料', 
 ARRAY['https://example.com/user3_screenshot1.jpg'], 
 '2024-01-15 12:30:00', '待批改', NULL);

-- 确保用户表中有对应的用户数据
INSERT INTO users (student_id, name, password, role) VALUES
('AXCF2025010019', '陶子', '123456', 'student'),
('AXCF2025010020', '张三', '123456', 'student'),
('AXCF2025010021', '李四', '123456', 'student')
ON CONFLICT (student_id) DO UPDATE SET
name = EXCLUDED.name,
password = EXCLUDED.password,
role = EXCLUDED.role;