-- 🧹 清理AXCF202505开头学员的测试打卡安排数据
-- 用途：删除测试设置的打卡安排，让学员重新自主设置
-- 保护：只删除打卡安排，不删除学员本身账户

-- ====================================================
-- 第一步：查看要删除的数据（确认范围）
-- ====================================================

-- 查看所有AXCF202505开头的打卡安排
SELECT
    student_id,
    start_date,
    end_date,
    is_active,
    created_at,
    created_by
FROM checkin_schedules
WHERE student_id LIKE 'AXCF202505%'
ORDER BY student_id, created_at;

-- 统计数量
SELECT
    'AXCF202505打卡安排总数' as description,
    COUNT(*) as count
FROM checkin_schedules
WHERE student_id LIKE 'AXCF202505%';

-- ====================================================
-- 第二步：检查相关的打卡记录
-- ====================================================

-- 查看这些学员是否有打卡记录
SELECT
    student_id,
    COUNT(*) as record_count,
    MIN(checkin_date) as first_checkin,
    MAX(checkin_date) as last_checkin
FROM checkin_records
WHERE student_id LIKE 'AXCF202505%'
GROUP BY student_id
ORDER BY student_id;

-- 统计AXCF202505的打卡记录总数
SELECT
    'AXCF202505打卡记录总数' as description,
    COUNT(*) as count
FROM checkin_records
WHERE student_id LIKE 'AXCF202505%';

-- ====================================================
-- 第三步：确认学员账户存在且角色正确
-- ====================================================

-- 确认这些学员的账户信息
SELECT
    student_id,
    name,
    real_name,
    role,
    created_at
FROM users
WHERE student_id LIKE 'AXCF202505%'
ORDER BY student_id;

-- ====================================================
-- 第四步：执行清理操作（请分步执行）
-- ====================================================

-- 🚨 重要提醒：
-- 1. 这将删除AXCF202505学员的所有打卡安排
-- 2. 这将删除AXCF202505学员的所有打卡记录
-- 3. 不会删除学员账户本身
-- 4. 删除后学员可以重新自主设置打卡时间

-- 步骤4.1：删除打卡记录（如果需要清空历史记录）
-- 取消注释下面的语句来执行删除
/*
DELETE FROM checkin_records
WHERE student_id LIKE 'AXCF202505%';
*/

-- 步骤4.2：删除打卡安排（核心操作）
-- 取消注释下面的语句来执行删除
/*
DELETE FROM checkin_schedules
WHERE student_id LIKE 'AXCF202505%';
*/

-- ====================================================
-- 第五步：验证清理结果
-- ====================================================

-- 验证打卡安排已删除
SELECT
    'AXCF202505剩余打卡安排' as description,
    COUNT(*) as count
FROM checkin_schedules
WHERE student_id LIKE 'AXCF202505%';

-- 验证打卡记录已删除（如果选择删除的话）
SELECT
    'AXCF202505剩余打卡记录' as description,
    COUNT(*) as count
FROM checkin_records
WHERE student_id LIKE 'AXCF202505%';

-- 确认学员账户仍然存在
SELECT
    'AXCF202505学员账户数' as description,
    COUNT(*) as count
FROM users
WHERE student_id LIKE 'AXCF202505%';

-- ====================================================
-- 第六步：检查自主设置权限（可选）
-- ====================================================

-- 如果有自主设置权限表，可以重新激活权限
-- （根据你的项目结构调整）

-- 查看AXCF202505学员是否有自主设置权限
-- SELECT student_id, has_self_schedule_permission
-- FROM users
-- WHERE student_id LIKE 'AXCF202505%';

-- ====================================================
-- 清理完成提示
-- ====================================================

SELECT
    '✅ AXCF202505测试数据清理脚本准备完成' as status,
    '请按步骤执行，确认每一步的结果' as note;