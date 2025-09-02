-- 清除现有的测试数据
DELETE FROM assignments;

-- 重置序列（使用正确的序列名称）
SELECT setval(pg_get_serial_sequence('assignments', 'assignment_id'), 1, false);

-- 插入真实的作业数据
INSERT INTO assignments (day_number, assignment_title, is_mandatory, description, assignment_category) VALUES
(1, '三项全能作品集', true, '你的截图需要包含以下三个内容：
1.网站截图
2.思维导图截图或者播客截图或者与notebook LM对话截图。
3.用AI生成的图片或者视频截图', 'Mandatory'),

(1, '遇事不决问AI', true, '用 AI 解决的问题，你的截图需要包含：你跟AI的对话截图，截图里面需要能够看清楚你的问题和AI的回答。', 'Mandatory'),

(1, '用AI一句话生成游戏', false, '你的截图需要包含：1.你跟AI的对话截图，截图里面需要能够看清楚你的提示词和AI的回答。2.游戏界面截图、运行效果截图。', 'Regular_Optional'),

(1, '用AI生成PPT', false, '你的截图需要包含：1.你跟AI的对话截图，截图里面需要能够看清楚你的提示词和AI的回答。2. AI生成的ppt截图，截图能看出包含PPT界面即可。', 'Regular_Optional'),

(2, 'AI让生活更美好', true, '你的截图需要包含：与AI的对话截图，AI给你的建议', 'Mandatory'),

(2, '综合问答练习', true, '你的截图需要包含:你跟AI的对话截图,截图里面需要能够看清楚你的问题和AI的回答。（作业要求详见飞书文档。）', 'Mandatory'),

(2, 'AI能力坐标定位', false, '你的截图里面包括：电脑画的坐标图可以、手绘的图也可以、有显示三条计划。', 'W1D2_Afternoon_Optional'),

(2, '爱学一派逆向工程分析', false, '你的截图需要包括：1.一份简短的商业机会分析报告截图。2，截图里需要包含机会描述、解决方案构想和商业模式创新三个部分。', 'W1D2_Afternoon_Optional'),

(2, 'AI工作流挑战赛', false, '你的截图需要包括：1.一份清晰的"AI工作流"图或文字描述。2.需要至少只用两个以上的AI工具。3，需要设计一个AI工作流，清晰地说明第1步用什么AI做什么，第2步用什么AI做什么，等。', 'W1D2_Afternoon_Optional'),

(2, '四步冲刺挑战', false, '你的截图需要包括：1.一个可演示的产品原型（或SOP）截图。2. 一份包含真实用户反馈的记录截图。3.项目路演PPT截图。', 'W1D2_Afternoon_Optional'),

(3, '用netlify部署自己的网站', true, '你的截图需要包括：1..在netlify上的部署后，网站运行展示，网站截图需要显示网址是netlify的，或者把部署过程截图。（作业详情见飞书文档。）', 'Mandatory'),

(3, '48小时创业行动计划', false, '你的截图需要包括：1.在AI的帮助下，定制自己的48小时创业行动计划，需要展示你和AI的对话截图。2.真实创业计划的结果，商业化截图证明。（作业详情看文档。）', 'Regular_Optional'),

(3, '专属课程外挂', false, '你的截图需要包括：1.在notebooklm上传多本书后的界面。2.生成的思维导图。', 'Regular_Optional'),

(4, '小微智能体上线', true, '你的截图需要包括：1.智能体界面。2，在小微智能体对话截图。', 'Mandatory'),

(4, '自己的产品客服上线小微', false, '你的截图需要包括：1.你的产品智能体的提示词设置界面。2，在小微智能体界面的运行情况截图。3.你的产品商业化的截图证明。', 'Regular_Optional'),

(5, '生成历史视频', true, '你的截图需要包括：1.工作流或智能体运行成功截图。2，在剪映里视频成功显示截图。', 'Mandatory'),

(5, '拆解小红书账号', true, '你的截图需要包括：智能体运行成功的截图与成功输出分析内容的文本截图。', 'Mandatory'),

(5, '生成小红书图文', true, '你的截图需要包括：智能体的聊天界面成功显示用户发送信息和智能体回复图文的对话记录（一张图无法显示，就用两张截图）。', 'Mandatory'),

(5, '改编历史视频工作流', true, '你的截图需要包括：1.显示扣子主页的里"个人空间"的"项目开发"或"资源库"里包含了"历史"相关字样的截图。2.工作流或聊天智能体运行成功返回url结果的截图。3，在剪映里视频成功显示截图。', 'Mandatory'),

(5, '复制拆解小红书账号工作流', true, '你的截图需要包括：1.显示扣子主页的里"个人空间"的"项目开发"或"资源库"里包含了"小红书账号"相关字样的截图。2.智能体运行成功并输出分析文本内容的截图。', 'Mandatory'),

(5, '复制生成小红书图文工作流', true, '1.显示扣子主页的里"个人空间"的"项目开发"或"资源库"里包含了"生成图文"相关字样的截图。2.智能体成功回复图文结果截图。', 'Mandatory'),

(5, '修改任意工作流', false, '你的截图需要包括：1.显示扣子主页的里"个人空间"的"项目开发"或"资源库"里包含了至少5个不同的工作流的截图。2.工作流运行成功并输出内容的截图。3.如是视频生成工作流则提交在剪映里的视频工程的截图。', 'Regular_Optional'),

(6, '开启AI全球化之路', true, '你的截图需要包含：1.你想模仿的油管（youtube）账号的截图。2.一份具体行动计划文档（作业详情见飞书文档。）', 'Mandatory'),

(7, '油管账号注册', true, '你的截图需要包含：你的油管频道界面', 'Mandatory'),

(7, '情绪驱动设计账号', true, '你的截图需要包含:账号设计相关结论的文档。（作业详情见飞书文档。）', 'Mandatory'),

(7, '分析对标出报告', true, '你的截图需要包含：1.分析账号数据截图。2，起号的行动指南。', 'Mandatory'),

(7, '虚拟资料', false, '你的截图需要包含：有变现金额截图或者具有用户量截图', 'Regular_Optional'),

(7, 'AI写作', false, '你的截图需要包含：有变现金额截图或者具有用户量截图', 'Regular_Optional'),

(7, 'AI音乐创作', false, '你的截图需要包含：有变现金额截图或者具有用户量截图', 'Regular_Optional'),

(8, '金句卡片生成器插件', true, '你的截图需要包含：1.cursor运行界面。2.浏览器的插件截图。3，漂亮的金句卡片截图。', 'Mandatory'),

(8, '谷歌插件上架', false, '你的截图需要包含：1.把浏览器插件发布到谷歌商店。2.并有运营或者盈利证明', 'Regular_Optional'),

(8, '创建dify机器人', true, '你的截图需要包含：与dify的对话截图', 'Mandatory'),

(8, 'n8n本地部署', true, '你的截图需要包含：在doker的界面，N8N显示部署成功（也就是最后显示类似localhost:5678的端口）的界面。', 'Mandatory'),

(8, 'cursor安装Supabase MCP数据库', true, '你的截图需要包含：1.在cursor安装Supabase MCP成功、有绿色小点的界面。2.通过cursor调用数据库成功创建表格的对话界面。3.Supabase里面有成功创建表格的界面。', 'Mandatory'),

(9, '改编扣子官方模板应用', true, '你的截图需要包含：1.工作流运行成功的界面。2.用户界面设置截图。3.预览运行效果界面截图。', 'Mandatory'),

(9, '改编官方其他应用模板', true, '你的截图需要包含：1.工作流运行成功的界面。2.用户界面设置截图。3.预览运行效果界面截图。', 'Mandatory'),

(9, '创建自己产品的扣子应用', false, '你的截图需要包含：1.工作流运行成功的界面。2.用户界面设置截图。3.预览运行效果界面截图。4.你的产品商业化的截图证明。', 'Regular_Optional'),

(10, '按模板做UI前端界面', true, '你的截图需要包含：1.一份在微信开发者工具里呈现的UI设计界面，只要展示清晰的UI界面、在微信开发者工具里即可。（作业详情看飞书文档。）', 'Mandatory'),

(10, '自己产品的UI前端界面', false, '你的截图需要包含：1.微信开发者工具看到你的ui设计界面。', 'Regular_Optional'),

(11, 'API接入小程序', true, '你的截图需要包含：1.微信开发者工具呈现小程序流畅运行的界面。2.在dify后台成功被调用的界面截图。', 'Mandatory'),

(11, '完善小程序功能细节', false, '你的截图需要包含：1.与cursor对话接入API的界面。2.微信开发者平台运行成功后的截图。', 'Regular_Optional'),

(11, '做自己产品的小程序', false, '你的截图需要包含：1.与cursor对话接入API的界面。2.微信开发者平台运行成功后的截图。3.你的产品做出的小程序商业化的截图。', 'Regular_Optional'),

(12, 'N8N辩论工作流', true, '你的截图需要包含：1.N8N成功运行无报错截图。2.成功对话后在下方log里能看到多个Agent输出的截图。', 'Mandatory'),

(12, 'N8N高我工作流', false, '你的截图需要包含：1.N8N成功运行无报错截图。2.成功对话后在下方log里能看到多个Agent输出的截图。', 'Regular_Optional'),

(12, 'N8N新闻播报', true, '你的截图需要包含：1.N8N成功运行无报错截图。2.飞书群机器人自动发送的新闻通知的截图。3.新闻成功新增到多维表格的截图。', 'Mandatory'),

(12, '修改N8N新闻机器人', false, '你的截图需要包含：1.N8N成功运行无报错截图。2.飞书群机器人自动发送的新闻通知的截图。3.新闻成功新增到多维表格的截图。', 'Regular_Optional'),

(12, 'manus做网站', false, '你的截图需要包含：1.你跟manus对话的提示词。2.网站设计结果截图。', 'Regular_Optional'),

(12, 'heyboss做网站', false, '你的截图需要包含：1.你跟heyboss对话的提示词。2.网站设计结果截图。', 'Regular_Optional'),

(13, '用SupabaseMCP搭建商业网站', true, '你的截图需要包含：1.cursor里面配置supabaseMCP成功的截图。2，新建网站截图。', 'Mandatory'),

(13, '调用封装MCP服务', true, '你的截图需要包含：调用MCP的截图。', 'Mandatory'),

(13, 'CEO指挥AI员工', false, '你的截图需要包含：整个N8N工作流调用几个AI员工成功运行的截图。', 'Regular_Optional');

-- 验证数据插入
SELECT 
  COUNT(*) as total_assignments,
  COUNT(CASE WHEN is_mandatory = true THEN 1 END) as mandatory_count,
  COUNT(CASE WHEN is_mandatory = false THEN 1 END) as optional_count,
  COUNT(CASE WHEN assignment_category = 'W1D2_Afternoon_Optional' THEN 1 END) as w1d2_afternoon_count
FROM assignments;

-- 显示按天分组的作业数量
SELECT 
  day_number,
  COUNT(*) as assignment_count,
  COUNT(CASE WHEN is_mandatory = true THEN 1 END) as mandatory_count,
  COUNT(CASE WHEN is_mandatory = false THEN 1 END) as optional_count
FROM assignments 
GROUP BY day_number 
ORDER BY day_number;