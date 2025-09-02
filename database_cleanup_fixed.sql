-- 🧹 数据库清理脚本 - 修复版
-- 删除无用的数据库表格和视图
-- 注意：请逐条执行，如果某条报错请跳过继续执行下一条

-- ===============================
-- 第一步：删除视图（必须先删除视图）
-- ===============================

-- 删除热门帖子视图
DROP VIEW IF EXISTS hot_posts CASCADE;

-- 删除学员帖子统计视图
DROP VIEW IF EXISTS student_post_stats CASCADE;

-- 删除学员最佳帖子视图
DROP VIEW IF EXISTS student_best_posts CASCADE;

-- ===============================
-- 第二步：删除无用的表格
-- ===============================

-- 1. 删除作业相关表格（已不再使用作业功能）
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;

-- 2. 删除毕业相关表格（已删除毕业管理功能）
DROP TABLE IF EXISTS student_graduation_status CASCADE;
DROP TABLE IF EXISTS graduation_requirements CASCADE;

-- 3. 删除内容生成相关表格（当前未使用AI内容生成功能）
DROP TABLE IF EXISTS generated_content CASCADE;

-- 4. 删除学员帖子相关表格（当前未使用此功能）
DROP TABLE IF EXISTS student_posts CASCADE;

-- 5. 删除打卡卡片表格（功能重复，已有checkin_records）
DROP TABLE IF EXISTS punch_cards CASCADE;

-- 6. 删除用户画像表格（当前未使用此功能）
DROP TABLE IF EXISTS user_personas CASCADE;

-- 7. 删除重复的打卡表格（与checkin_records功能重复）
DROP TABLE IF EXISTS xhs_checkins CASCADE;

-- 8. 删除打卡计划表格（功能已合并到checkin_schedules）
DROP TABLE IF EXISTS checkin_plans CASCADE;

-- 9. 删除小红书相关缓存表格（爬虫功能已移除）
DROP TABLE IF EXISTS xhs_search_logs CASCADE;
DROP TABLE IF EXISTS xhs_notes_cache CASCADE;
DROP TABLE IF EXISTS xhs_alerts CASCADE;

-- 10. 删除退款申请表格（功能简化）
DROP TABLE IF EXISTS xhs_refund_requests CASCADE;

-- 11. 删除学员打卡记录表（重复功能）
DROP TABLE IF EXISTS student_checkins CASCADE;

-- ===============================
-- 第三步：清理索引（如果表已删除，索引会自动删除）
-- ===============================

-- 这些索引会随着表的删除自动删除，但为了确保清理干净，可以手动删除
DROP INDEX IF EXISTS idx_checkins_student_id;
DROP INDEX IF EXISTS idx_checkins_date;
DROP INDEX IF EXISTS idx_checkins_passed;
DROP INDEX IF EXISTS idx_search_logs_student_id;
DROP INDEX IF EXISTS idx_search_logs_created_at;
DROP INDEX IF EXISTS idx_search_logs_keywords;
DROP INDEX IF EXISTS idx_notes_cache_liked_count;
DROP INDEX IF EXISTS idx_notes_cache_last_seen;
DROP INDEX IF EXISTS idx_notes_cache_author;

-- ===============================
-- 第四步：验证清理结果
-- ===============================

-- 查看剩余的表格
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 查看剩余的视图
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'VIEW'
ORDER BY table_name;

-- ===============================
-- 清理完成后的表格说明
-- ===============================

-- 保留的有用表格：
-- - users: 用户基础信息
-- - checkin_schedules: 打卡时间安排（管理员设置的93天周期）
-- - checkin_records: 打卡记录（学员实际打卡数据）

-- 已删除的无用表格：
-- - submissions, assignments: 作业系统（已废弃）
-- - student_graduation_status, graduation_requirements: 毕业管理（已废弃）
-- - generated_content: AI内容生成（未使用）
-- - student_posts, student_post_stats, hot_posts: 帖子统计（未使用）
-- - punch_cards: 重复的打卡功能
-- - user_personas: 用户画像（未使用）
-- - xhs_*: 小红书爬虫相关（已移除）
-- - checkin_plans: 重复的打卡计划功能
