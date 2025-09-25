-- ===================================
-- 🛠️ 简单修复脚本 - 分步执行
-- ===================================
-- 请按顺序逐步执行，每执行一步检查结果

-- =====================================================
-- 🔍 第1步：检查当前表结构
-- =====================================================
SELECT '=== 第1步：检查 checkin_records 表结构 ===' as info;

SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
ORDER BY ordinal_position;

-- =====================================================
-- 🔧 第2步：修复ID字段默认值
-- =====================================================
SELECT '=== 第2步：设置ID字段默认值 ===' as info;

ALTER TABLE checkin_records 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- =====================================================
-- 🔧 第3步：修复时间字段默认值
-- =====================================================
SELECT '=== 第3步：设置时间字段默认值 ===' as info;

ALTER TABLE checkin_records 
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE checkin_records 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- =====================================================
-- 🔧 第4步：创建更新触发器
-- =====================================================
SELECT '=== 第4步：创建更新触发器 ===' as info;

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS update_checkin_records_updated_at ON checkin_records;

-- 创建新触发器
CREATE TRIGGER update_checkin_records_updated_at
    BEFORE UPDATE ON checkin_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🔧 第5步：确保唯一约束存在
-- =====================================================
SELECT '=== 第5步：检查和创建唯一约束 ===' as info;

-- 检查现有约束
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'checkin_records'::regclass;

-- 创建唯一约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'checkin_records'::regclass 
        AND conname = 'unique_student_checkin_date'
    ) THEN
        ALTER TABLE checkin_records 
        ADD CONSTRAINT unique_student_checkin_date 
        UNIQUE (student_id, checkin_date);
    END IF;
END $$;

-- =====================================================
-- ✅ 第6步：验证修复结果
-- =====================================================
SELECT '=== 第6步：验证修复结果 ===' as info;

-- 检查字段默认值
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
AND column_name IN ('id', 'created_at', 'updated_at');

-- 检查触发器
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'checkin_records';

-- 检查约束
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'checkin_records'::regclass;

SELECT '=== 修复完成！现在可以测试打卡提交功能 ===' as info;
