-- 更新现有作业的标题和描述为真实内容
-- 保持UUID不变，只更新内容

-- 第一周第一天
UPDATE assignments SET assignment_title = '小红书账号注册与基础设置', description = '注册小红书账号，完善个人资料，了解平台基本功能' WHERE day_text = '第一周第一天' AND assignment_title = '小红书账号注册与设置';

UPDATE assignments SET assignment_title = '竞品分析与定位', description = '分析同领域优秀账号，确定自己的内容定位' WHERE day_text = '第一周第一天' AND assignment_title = '平台规则学习';

-- 第一周第二天上午
UPDATE assignments SET assignment_title = '数据分析与优化', description = '分析笔记数据，学习优化方法，总结经验' WHERE day_text = '第一周第二天上午' AND assignment_title = '内容定位确定';

UPDATE assignments SET assignment_title = '社群互动练习', description = '主动与其他用户互动，建立社群关系', is_mandatory = false WHERE day_text = '第一周第二天上午' AND assignment_title = '关键词研究';

-- 第一周第二天下午  
UPDATE assignments SET assignment_title = '内容规划制定', description = '制定未来一周的内容发布计划' WHERE day_text = '第一周第二天下午' AND assignment_title = '首篇笔记发布';

UPDATE assignments SET assignment_title = '品牌形象设计', description = '设计个人品牌形象，包括头像、简介等', is_mandatory = false WHERE day_text = '第一周第二天下午' AND assignment_title = '封面设计练习';

-- 继续更新其他作业...
UPDATE assignments SET assignment_title = '热点追踪与应用', description = '学会追踪热点话题，并应用到内容创作中' WHERE day_text = '第一周第三天' AND assignment_title = '互动策略学习';

UPDATE assignments SET assignment_title = '周总结与反思', description = '总结第一周的学习成果和经验教训' WHERE day_text = '第一周第三天' AND assignment_title = '数据分析基础';

-- 添加更多真实的作业内容
INSERT INTO assignments (day_text, assignment_title, is_mandatory, description) VALUES
('第一周第三天下午', '粉丝增长策略', true, '学习有效的粉丝增长方法'),
('第一周第三天下午', 'SEO优化技巧', false, '学习小红书内容的SEO优化'),
('第一周第四天上午', '社群运营基础', true, '学习社群运营的基本方法'),
('第一周第四天下午', '高级内容策划', true, '学习更高级的内容策划技巧'),
('第一周第五天上午', '内容矩阵搭建', true, '搭建多平台内容分发矩阵'),
('第一周第五天下午', '直播带货入门', true, '学习直播带货的基本技巧'),
('第一周第六天', '数据驱动优化', true, '基于数据分析优化内容策略'),
('第一周第七天', '商业计划制定', true, '制定个人IP的商业发展计划');