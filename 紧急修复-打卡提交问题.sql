-- ===================================
-- 🚨 紧急修复：打卡提交ID字段问题
-- ===================================
-- 问题：插入数据时ID字段违反非空约束
-- 原因：表结构中ID字段可能没有设置默认值

-- =====================================================
-- 🔍 第1步：检查当前 checkin_records 表结构
-- =====================================================

SELECT '=== 检查 checkin_records 表结构 ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
ORDER BY ordinal_position;

-- =====================================================
-- 🛠️ 第2步：修复ID字段默认值问题
-- =====================================================

-- 确保ID字段有默认值
ALTER TABLE checkin_records 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 确保created_at和updated_at有默认值
ALTER TABLE checkin_records 
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE checkin_records 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- =====================================================
-- 🔧 第3步：创建更新时间触发器
-- =====================================================

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为checkin_records表添加更新时间触发器
DROP TRIGGER IF EXISTS update_checkin_records_updated_at ON checkin_records;
CREATE TRIGGER update_checkin_records_updated_at
    BEFORE UPDATE ON checkin_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🧪 第4步：测试插入数据
-- =====================================================

-- 首先检查是否存在唯一约束
SELECT '=== 检查现有约束 ===' as info;
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'checkin_records'::regclass;

-- 如果没有唯一约束，先创建
ALTER TABLE checkin_records
ADD CONSTRAINT IF NOT EXISTS unique_student_checkin_date
UNIQUE (student_id, checkin_date);

-- 测试插入一条记录（使用一个测试学号）
-- 注意：请确保这个学号在users表中存在
INSERT INTO checkin_records (student_id, checkin_date, xhs_url, status)
VALUES ('TEST_STUDENT_001', CURRENT_DATE, 'https://www.xiaohongshu.com/test', 'valid')
ON CONFLICT (student_id, checkin_date) DO UPDATE SET
    xhs_url = EXCLUDED.xhs_url,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 查看插入结果
SELECT '=== 测试插入结果 ===' as info;
SELECT * FROM checkin_records 
WHERE student_id = 'TEST_STUDENT_001' 
ORDER BY created_at DESC 
LIMIT 1;

-- =====================================================
-- 🗑️ 第5步：清理测试数据
-- =====================================================

-- 删除测试数据
DELETE FROM checkin_records WHERE student_id = 'TEST_STUDENT_001';

-- =====================================================
-- ✅ 第6步：验证修复结果
-- =====================================================

SELECT '=== 验证修复后的表结构 ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
AND column_name IN ('id', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- 检查触发器是否创建成功
SELECT '=== 检查触发器 ===' as info;
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'checkin_records';

-- =====================================================
-- 📋 第7步：修复说明
-- =====================================================

/*
修复内容：
1. ✅ 为ID字段设置默认值 gen_random_uuid()
2. ✅ 为created_at字段设置默认值 NOW()
3. ✅ 为updated_at字段设置默认值 NOW()
4. ✅ 创建自动更新updated_at的触发器
5. ✅ 测试插入功能是否正常

修复后效果：
- 插入数据时不需要手动指定ID、created_at、updated_at
- 数据库会自动生成UUID作为ID
- 自动设置创建时间和更新时间
- 更新记录时自动更新updated_at字段

注意事项：
- 这个脚本是安全的，不会删除现有数据
- 只是修改表结构，添加默认值和触发器
- 可以在生产环境中安全执行
*/
