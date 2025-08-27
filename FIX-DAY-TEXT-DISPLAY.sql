-- 修复天数显示问题 - 添加并更新 day_text 字段

-- 1. 检查并添加 day_text 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assignments' AND column_name = 'day_text') THEN
        ALTER TABLE assignments ADD COLUMN day_text TEXT;
    END IF;
END $$;

-- 2. 根据 assignment_title 更新对应的 day_text
UPDATE assignments SET day_text = '第一周第一天' WHERE assignment_title IN ('三项全能作品集', '遇事不决问AI', '用AI一句话生成游戏', '用AI生成PPT');

UPDATE assignments SET day_text = '第一周第二天上午' WHERE assignment_title IN ('AI让生活更美好', '综合问答练习');

UPDATE assignments SET day_text = '第一周第二天下午' WHERE assignment_title IN ('AI能力坐标定位', '爱学一派逆向工程分析', 'AI工作流挑战赛', '四步冲刺挑战');

UPDATE assignments SET day_text = '第一周第三天' WHERE assignment_title IN ('用netlify部署自己的网站', '48小时创业行动计划', '专属课程外挂');

UPDATE assignments SET day_text = '第一周第四天' WHERE assignment_title IN ('小微智能体上线', '自己的产品客服上线小微');

UPDATE assignments SET day_text = '第一周第五天上午' WHERE assignment_title IN ('生成历史视频', '拆解小红书账号', '生成小红书图文');

UPDATE assignments SET day_text = '第一周第五天下午' WHERE assignment_title IN ('改编历史视频工作流', '复制拆解小红书账号工作流', '复制生成小红书图文工作流', '修改任意工作流');

UPDATE assignments SET day_text = '第一周第六天' WHERE assignment_title = '开启AI全球化之路';

UPDATE assignments SET day_text = '第一周第七天上午' WHERE assignment_title IN ('油管账号注册', '情绪驱动设计账号', '分析对标出报告');

UPDATE assignments SET day_text = '第一周第七天下午' WHERE assignment_title IN ('虚拟资料', 'AI写作', 'AI音乐创作');

UPDATE assignments SET day_text = '第二周第一天上午' WHERE assignment_title IN ('金句卡片生成器插件', '谷歌插件上架', '创建dify机器人');

UPDATE assignments SET day_text = '第二周第一天下午' WHERE assignment_title IN ('n8n本地部署', 'cursor安装Supabase MCP数据库');

UPDATE assignments SET day_text = '第二周第二天' WHERE assignment_title IN ('改编扣子官方模板应用', '改编官方其他应用模板', '创建自己产品的扣子应用');

UPDATE assignments SET day_text = '第二周第三天' WHERE assignment_title IN ('按模板做UI前端界面', '自己产品的UI前端界面');

UPDATE assignments SET day_text = '第二周第四天' WHERE assignment_title IN ('API接入小程序', '完善小程序功能细节', '做自己产品的小程序');

UPDATE assignments SET day_text = '第二周第五天' WHERE assignment_title IN ('N8N辩论工作流', 'N8N高我工作流', 'N8N新闻播报', '修改N8N新闻机器人', 'manus做网站', 'heyboss做网站');

UPDATE assignments SET day_text = '第二周第六天' WHERE assignment_title IN ('用SupabaseMCP搭建商业网站', '调用封装MCP服务', 'CEO指挥AI员工');

-- 3. 验证更新结果
SELECT 
  day_text,
  COUNT(*) as assignment_count,
  STRING_AGG(assignment_title, ', ') as assignments
FROM assignments 
WHERE day_text IS NOT NULL
GROUP BY day_text 
ORDER BY 
  CASE 
    WHEN day_text LIKE '%第一周第一天%' THEN 1
    WHEN day_text LIKE '%第一周第二天上午%' THEN 2
    WHEN day_text LIKE '%第一周第二天下午%' THEN 3
    WHEN day_text LIKE '%第一周第三天%' THEN 4
    WHEN day_text LIKE '%第一周第四天%' THEN 5
    WHEN day_text LIKE '%第一周第五天上午%' THEN 6
    WHEN day_text LIKE '%第一周第五天下午%' THEN 7
    WHEN day_text LIKE '%第一周第六天%' THEN 8
    WHEN day_text LIKE '%第一周第七天上午%' THEN 9
    WHEN day_text LIKE '%第一周第七天下午%' THEN 10
    WHEN day_text LIKE '%第二周第一天上午%' THEN 11
    WHEN day_text LIKE '%第二周第一天下午%' THEN 12
    WHEN day_text LIKE '%第二周第二天%' THEN 13
    WHEN day_text LIKE '%第二周第三天%' THEN 14
    WHEN day_text LIKE '%第二周第四天%' THEN 15
    WHEN day_text LIKE '%第二周第五天%' THEN 16
    WHEN day_text LIKE '%第二周第六天%' THEN 17
    ELSE 99
  END;

-- 4. 检查是否有未分配 day_text 的作业
SELECT assignment_title, day_number 
FROM assignments 
WHERE day_text IS NULL;