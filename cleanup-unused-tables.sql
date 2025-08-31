-- 删除无用的数据库表格
-- 这些表格在当前应用中没有被使用，可以安全删除
-- 注意：请逐条执行，如果某条报错请跳过继续执行下一条

-- 1. 删除作业相关表格（已不再使用作业功能）
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;

-- 2. 删除毕业相关表格（已删除毕业管理功能）
DROP TABLE IF EXISTS student_graduation_status CASCADE;
DROP TABLE IF EXISTS graduation_requirements CASCADE;

-- 3. 删除内容生成相关表格（当前未使用AI内容生成功能）
DROP TABLE IF EXISTS generated_content CASCADE;

-- 4. 删除热门帖子相关表格（当前未使用此功能）
DROP TABLE IF EXISTS student_best_posts CASCADE;
DROP TABLE IF EXISTS hot_posts CASCADE;

-- 5. 删除打卡卡片表格（功能重复，已有checkin_records）
DROP TABLE IF EXISTS punch_cards CASCADE;

-- 6. 删除学员帖子统计表格（当前未使用统计功能）
DROP TABLE IF EXISTS student_post_stats CASCADE;
DROP TABLE IF EXISTS student_posts CASCADE;

-- 7. 删除用户画像表格（当前未使用此功能）
DROP TABLE IF EXISTS user_personas CASCADE;

-- 8. 删除重复的打卡表格（与checkin_records功能重复）
DROP TABLE IF EXISTS xhs_checkins CASCADE;

-- 9. 删除打卡计划表格（功能已合并到checkin_schedules）
DROP TABLE IF EXISTS checkin_plans CASCADE;

-- 清理完成后的表格说明：
-- 保留的有用表格：
-- - users: 用户基础信息
-- - checkin_schedules: 打卡时间安排（管理员设置的93天周期）
-- - checkin_records: 打卡记录（学员实际打卡数据）
