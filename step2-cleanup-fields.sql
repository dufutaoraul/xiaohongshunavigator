-- 第2步：清理重复字段
-- 这是主要目标：删除xiaohongshu_url字段

-- 检查表结构
SELECT 'checkin_records_before_cleanup' as step,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns
WHERE table_name = 'checkin_records'
ORDER BY ordinal_position;

-- 删除重复字段
ALTER TABLE checkin_records DROP COLUMN IF EXISTS xiaohongshu_url;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS student_name;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS content_title;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS content_description;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS plan_id;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS post_publish_time;

-- 删除重复表
DROP TABLE IF EXISTS student_checkins CASCADE;
DROP TABLE IF EXISTS xhs_checkins CASCADE;
DROP TABLE IF EXISTS checkin_plans CASCADE;
DROP TABLE IF EXISTS punch_cards CASCADE;

-- 检查清理结果
SELECT 'checkin_records_after_cleanup' as step,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns
WHERE table_name = 'checkin_records'
ORDER BY ordinal_position;