-- ===================================
-- 🔧 修复外键约束问题
-- ===================================
-- 问题：checkin_records 表中存在 users 表中不存在的 student_id

-- =====================================================
-- 🔍 第1步：诊断问题
-- =====================================================

-- 检查 users 表中的所有学员ID
SELECT 'users 表中的学员ID:' as info;
SELECT student_id, name FROM users ORDER BY student_id;

-- 检查 checkin_records 表中的学员ID
SELECT 'checkin_records 表中的学员ID:' as info;
SELECT DISTINCT student_id FROM checkin_records ORDER BY student_id;

-- 找出在 checkin_records 中但不在 users 中的学员ID
SELECT '孤立的打卡记录 (无对应用户):' as info;
SELECT DISTINCT cr.student_id
FROM checkin_records cr
LEFT JOIN users u ON cr.student_id = u.student_id
WHERE u.student_id IS NULL;

-- =====================================================
-- 🗑️ 第2步：清理孤立数据
-- =====================================================

-- 删除没有对应用户的打卡记录
DELETE FROM checkin_records
WHERE student_id NOT IN (SELECT student_id FROM users);

-- 检查清理结果
SELECT '清理后的 checkin_records 记录数:' as info;
SELECT COUNT(*) as total_records FROM checkin_records;

-- =====================================================
-- 🔄 第3步：重新应用外键约束（安全版本）
-- =====================================================

-- 先删除现有的外键约束
ALTER TABLE checkin_records DROP CONSTRAINT IF EXISTS checkin_records_student_id_fkey;

-- 重新添加外键约束
ALTER TABLE checkin_records
ADD CONSTRAINT checkin_records_student_id_fkey
FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE;

-- =====================================================
-- ✅ 第4步：验证修复结果
-- =====================================================

-- 验证外键约束是否正常工作
SELECT 'foreign key 约束验证:' as info;
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'checkin_records';

-- 验证数据完整性
SELECT '数据完整性检查:' as info;
SELECT
    u.student_id,
    u.name,
    COUNT(cr.id) as checkin_count
FROM users u
LEFT JOIN checkin_records cr ON u.student_id = cr.student_id
GROUP BY u.student_id, u.name
ORDER BY u.student_id;