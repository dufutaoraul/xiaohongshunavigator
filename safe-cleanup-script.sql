-- 🛡️ 安全的数据库清理脚本
-- 用途：清理测试数据，保留学员真实数据
-- 警告：请在执行前仔细检查每一步

-- ====================================================
-- 第一步：备份重要数据（可选，建议执行）
-- ====================================================

-- 查看当前用户总数
SELECT 'users总数' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'checkin_records总数', COUNT(*) FROM checkin_records
UNION ALL
SELECT 'checkin_schedules总数', COUNT(*) FROM checkin_schedules;

-- ====================================================
-- 第二步：验证管理员账户
-- ====================================================

-- 检查管理员账户（请确认这些是正确的管理员）
SELECT student_id, name, real_name, role, created_at
FROM users
WHERE role = 'admin'
ORDER BY created_at;

-- ====================================================
-- 第三步：删除测试表（安全操作）
-- ====================================================

-- 删除自主安排相关的测试表
DROP TABLE IF EXISTS self_schedule_permissions;
DROP TABLE IF EXISTS self_schedule_ranges;

-- 验证删除结果
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%self_schedule%';

-- ====================================================
-- 第四步：清理测试用户数据（谨慎操作）
-- ====================================================

-- 🚨 重要：执行前请确认哪些是测试用户
-- 查看可能的测试用户（请手动检查）
SELECT student_id, name, real_name, role, created_at
FROM users
WHERE student_id LIKE 'TEST%'
   OR student_id LIKE 'test%'
   OR name LIKE '%测试%'
   OR name LIKE '%test%'
ORDER BY created_at;

-- 如果确认上述是测试用户，取消下面的注释来删除
-- ⚠️ 警告：删除前请三次确认
/*
DELETE FROM checkin_records
WHERE student_id IN (
    SELECT student_id FROM users
    WHERE student_id LIKE 'TEST%'
       OR student_id LIKE 'test%'
       OR name LIKE '%测试%'
       OR name LIKE '%test%'
);

DELETE FROM checkin_schedules
WHERE student_id IN (
    SELECT student_id FROM users
    WHERE student_id LIKE 'TEST%'
       OR student_id LIKE 'test%'
       OR name LIKE '%测试%'
       OR name LIKE '%test%'
);

DELETE FROM users
WHERE student_id LIKE 'TEST%'
   OR student_id LIKE 'test%'
   OR name LIKE '%测试%'
   OR name LIKE '%test%';
*/

-- ====================================================
-- 第五步：验证清理结果
-- ====================================================

-- 检查清理后的数据
SELECT 'users剩余' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'checkin_records剩余', COUNT(*) FROM checkin_records
UNION ALL
SELECT 'checkin_schedules剩余', COUNT(*) FROM checkin_schedules;

-- 确认管理员账户仍然存在
SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin';

-- ====================================================
-- 第六步：优化数据库（可选）
-- ====================================================

-- 重新计算表统计信息
ANALYZE users;
ANALYZE checkin_records;
ANALYZE checkin_schedules;

-- 执行完成提示
SELECT '🎉 清理脚本执行完成！请检查上面的验证结果。' as status;