-- ===================================
-- 🛡️ 安全的数据库清理和标准化
-- ===================================
-- 解决外键约束冲突问题

-- =====================================================
-- 🔍 第1步：诊断当前状态
-- =====================================================

-- 检查所有表
SELECT 'all_tables' as info, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 🔓 第2步：移除所有外键约束（临时）
-- =====================================================

-- 移除 checkin_records 的外键约束
ALTER TABLE checkin_records DROP CONSTRAINT IF EXISTS checkin_records_student_id_fkey;

-- 移除 checkin_schedules 的外键约束（如果存在）
ALTER TABLE checkin_schedules DROP CONSTRAINT IF EXISTS checkin_schedules_student_id_fkey;

-- =====================================================
-- 🧹 第3步：清理重复和无用的表
-- =====================================================

-- 删除重复或不使用的表
DROP TABLE IF EXISTS student_checkins CASCADE;
DROP TABLE IF EXISTS xhs_checkins CASCADE;
DROP TABLE IF EXISTS checkin_plans CASCADE;
DROP TABLE IF EXISTS punch_cards CASCADE;

-- =====================================================
-- 🏗️ 第4步：标准化 checkin_records 表（无外键版本）
-- =====================================================

-- 删除重复字段
ALTER TABLE checkin_records DROP COLUMN IF EXISTS xiaohongshu_url;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS student_name;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS content_title;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS content_description;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS plan_id;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS post_publish_time;

-- 确保必要字段存在且类型正确
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS checkin_date DATE;
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS xhs_url TEXT;
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'valid';
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS admin_review_notes TEXT;
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 添加主键（如果不存在）
ALTER TABLE checkin_records DROP CONSTRAINT IF EXISTS checkin_records_pkey;
ALTER TABLE checkin_records ADD CONSTRAINT checkin_records_pkey PRIMARY KEY (id);

-- 添加状态约束
ALTER TABLE checkin_records DROP CONSTRAINT IF EXISTS checkin_records_status_check;
ALTER TABLE checkin_records ADD CONSTRAINT checkin_records_status_check
    CHECK (status IN ('valid', 'invalid', 'pending'));

-- 添加唯一约束
ALTER TABLE checkin_records DROP CONSTRAINT IF EXISTS checkin_records_student_id_checkin_date_key;
ALTER TABLE checkin_records ADD CONSTRAINT checkin_records_student_id_checkin_date_key
    UNIQUE(student_id, checkin_date);

-- =====================================================
-- 🏗️ 第5步：创建 checkin_schedules 表
-- =====================================================

CREATE TABLE IF NOT EXISTS checkin_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    schedule_type TEXT DEFAULT 'admin_set' CHECK (schedule_type IN ('admin_set', 'self_set')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, start_date)
);

-- =====================================================
-- 📊 第6步：创建索引
-- =====================================================

-- 为常用查询创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_records_student_date
ON checkin_records(student_id, checkin_date);

CREATE INDEX IF NOT EXISTS idx_checkin_records_status
ON checkin_records(status);

CREATE INDEX IF NOT EXISTS idx_checkin_schedules_student_active
ON checkin_schedules(student_id, is_active);

-- =====================================================
-- 📝 第7步：添加表注释
-- =====================================================

COMMENT ON TABLE checkin_records IS '学员打卡记录表 - 存储每日小红书链接提交';
COMMENT ON TABLE checkin_schedules IS '打卡时间安排表 - 管理员或学员设置的打卡周期';

COMMENT ON COLUMN checkin_records.student_id IS '学员学号';
COMMENT ON COLUMN checkin_records.checkin_date IS '打卡日期';
COMMENT ON COLUMN checkin_records.xhs_url IS '小红书链接';
COMMENT ON COLUMN checkin_records.status IS '审核状态: valid-有效, invalid-无效, pending-待审核';

COMMENT ON COLUMN checkin_schedules.schedule_type IS '设置类型: admin_set-管理员设置, self_set-学员自主设置';

-- =====================================================
-- ✅ 第8步：验证结果
-- =====================================================

-- 验证表结构
SELECT 'checkin_records_structure' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'checkin_records'
ORDER BY ordinal_position;

SELECT 'checkin_schedules_structure' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'checkin_schedules'
ORDER BY ordinal_position;

-- 检查数据
SELECT 'checkin_records_count' as info, COUNT(*) as count FROM checkin_records;
SELECT 'checkin_schedules_count' as info, COUNT(*) as count FROM checkin_schedules;