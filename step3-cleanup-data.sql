-- 第3步：清理孤立数据

-- 显示要删除的孤立记录
SELECT 'records_to_delete' as step,
       cr.student_id,
       cr.checkin_date,
       cr.xhs_url
FROM checkin_records cr
LEFT JOIN users u ON cr.student_id = u.student_id
WHERE u.student_id IS NULL;

-- 删除孤立的打卡记录
DELETE FROM checkin_records
WHERE student_id NOT IN (SELECT student_id FROM users WHERE student_id IS NOT NULL);

-- 检查清理结果
SELECT 'remaining_records' as step, COUNT(*) as count FROM checkin_records;

-- 验证数据完整性
SELECT 'data_integrity_check' as step,
       u.student_id,
       u.name,
       COUNT(cr.id) as checkin_count
FROM users u
LEFT JOIN checkin_records cr ON u.student_id = cr.student_id
GROUP BY u.student_id, u.name
ORDER BY u.student_id;