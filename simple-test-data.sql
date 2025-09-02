-- 简化版测试数据
-- 为学号 AXCF2025010019 添加一些测试提交记录

INSERT INTO submissions (
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
('AXCF2025010019', 'd389d72a-34aa-405b-87c1-2ebfcf9cd66f', '小红书账号注册与设置', '第一周第一天', true, '注册小红书账号，完善个人资料', 
 ARRAY['https://example.com/screenshot1.jpg'], 
 '2024-01-15 10:30:00', '合格', '账号设置完成良好，符合要求。'),

('AXCF2025010019', 'ee995805-c5ef-4e88-9877-5cbfca5afd16', '平台规则学习', '第一周第一天', true, '学习小红书平台规则', 
 ARRAY['https://example.com/notes1.jpg'], 
 '2024-01-15 16:45:00', '合格', '规则学习认真，理解到位。'),

('AXCF2025010019', '4d594f12-eb0e-4f0b-84d3-3dd9862289b5', '首篇笔记发布', '第一周第二天下午', true, '发布第一篇小红书笔记', 
 ARRAY['https://example.com/note1.jpg'], 
 '2024-01-16 15:20:00', '待批改', NULL);