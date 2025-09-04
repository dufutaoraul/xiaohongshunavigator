-- 清理数据库表 - 只保留核心的三个表
-- 执行时间：2025-09-03
-- 说明：根据用户反馈，只保留 users、checkin_schedules、checkin_records 三个核心表

-- =====================================================
-- 删除自主设定相关的表（功能已简化，不再需要）
-- =====================================================
DROP TABLE IF EXISTS self_schedule_permissions CASCADE;
DROP TABLE IF EXISTS self_schedule_ranges CASCADE;
DROP TABLE IF EXISTS self_schedule_settings CASCADE;

-- =====================================================
-- 删除小红书相关的表（当前不需要）
-- =====================================================
DROP TABLE IF EXISTS xiaohongshu_accounts CASCADE;
DROP TABLE IF EXISTS xhs_checkins CASCADE;
DROP TABLE IF EXISTS xhs_search_logs CASCADE;
DROP TABLE IF EXISTS xhs_notes_cache CASCADE;
DROP TABLE IF EXISTS xhs_alerts CASCADE;
DROP TABLE IF EXISTS xhs_refund_requests CASCADE;

-- =====================================================
-- 删除作业相关的表（已不使用）
-- =====================================================
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;

-- =====================================================
-- 删除其他不必要的表
-- =====================================================
DROP TABLE IF EXISTS student_checkins CASCADE;
DROP TABLE IF EXISTS checkin_plans CASCADE;
DROP TABLE IF EXISTS punch_cards CASCADE;
DROP TABLE IF EXISTS student_posts CASCADE;
DROP TABLE IF EXISTS student_post_stats CASCADE;
DROP TABLE IF EXISTS hot_posts CASCADE;
DROP TABLE IF EXISTS generated_content CASCADE;
DROP TABLE IF EXISTS student_graduation_status CASCADE;
DROP TABLE IF EXISTS graduation_requirements CASCADE;

-- =====================================================
-- 删除视图
-- =====================================================
DROP VIEW IF EXISTS student_best_posts CASCADE;

-- =====================================================
-- 清理users表中不必要的字段
-- =====================================================
-- 删除自主设定相关字段（功能已简化）
ALTER TABLE users DROP COLUMN IF EXISTS can_self_schedule;
ALTER TABLE users DROP COLUMN IF EXISTS has_used_self_schedule;
ALTER TABLE users DROP COLUMN IF EXISTS self_schedule_deadline;

-- 删除其他不必要的字段
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS first_login;

-- =====================================================
-- 清理checkin_schedules表中不必要的字段
-- =====================================================
ALTER TABLE checkin_schedules DROP COLUMN IF EXISTS schedule_type;

-- =====================================================
-- 验证清理结果
-- =====================================================
-- 查看剩余的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 查看users表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 查看checkin_schedules表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'checkin_schedules' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 查看checkin_records表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
