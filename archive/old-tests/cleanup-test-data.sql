-- 清理测试数据脚本
-- 清除非AXCF202501开头的checkin_schedules数据，并重置对应用户的can_self_schedule权限

-- 1. 首先查看将要删除的数据（用于备份和确认）
-- 查看即将删除的checkin_schedules记录
SELECT
    cs.id,
    cs.student_id,
    cs.start_date,
    cs.end_date,
    cs.schedule_type,
    cs.created_by,
    cs.is_active
FROM checkin_schedules cs
WHERE cs.student_id NOT LIKE 'AXCF202501%'
ORDER BY cs.student_id;

-- 查看即将重置权限的用户
SELECT
    u.student_id,
    u.name,
    u.can_self_schedule,
    u.has_used_self_schedule,
    u.self_schedule_deadline
FROM users u
WHERE u.student_id IN (
    SELECT DISTINCT cs.student_id
    FROM checkin_schedules cs
    WHERE cs.student_id NOT LIKE 'AXCF202501%'
)
ORDER BY u.student_id;

-- 2. 执行清理操作（先更新用户权限，再删除打卡安排）
-- 重置对应用户的自主设定权限
UPDATE users
SET
    can_self_schedule = false,
    has_used_self_schedule = false,
    self_schedule_deadline = NULL,
    updated_at = NOW()
WHERE student_id IN (
    SELECT DISTINCT cs.student_id
    FROM checkin_schedules cs
    WHERE cs.student_id NOT LIKE 'AXCF202501%'
);

-- 删除非AXCF202501开头的checkin_schedules数据
DELETE FROM checkin_schedules
WHERE student_id NOT LIKE 'AXCF202501%';

-- 3. 验证清理结果
-- 查看剩余的checkin_schedules数据（应该只有AXCF202501开头的）
SELECT
    cs.id,
    cs.student_id,
    cs.start_date,
    cs.end_date,
    cs.schedule_type,
    cs.created_by,
    cs.is_active
FROM checkin_schedules cs
ORDER BY cs.student_id;

-- 查看权限已重置的用户数量
SELECT
    COUNT(*) as reset_users_count,
    COUNT(CASE WHEN can_self_schedule = false THEN 1 END) as users_with_false_permission
FROM users
WHERE student_id NOT LIKE 'AXCF202501%'
AND (can_self_schedule = false OR has_used_self_schedule = false OR self_schedule_deadline IS NULL);

-- 查看保留的AXCF202501用户状态
SELECT
    u.student_id,
    u.name,
    u.can_self_schedule,
    u.has_used_self_schedule,
    u.self_schedule_deadline
FROM users u
WHERE u.student_id LIKE 'AXCF202501%'
ORDER BY u.student_id;

-- 操作摘要统计
SELECT
    'checkin_schedules' as table_name,
    'deleted_records' as operation,
    COUNT(*) as affected_count
FROM checkin_schedules cs_deleted
WHERE NOT EXISTS (
    SELECT 1 FROM checkin_schedules cs_current
    WHERE cs_current.student_id = cs_deleted.student_id
    AND cs_deleted.student_id NOT LIKE 'AXCF202501%'
)

UNION ALL

SELECT
    'users' as table_name,
    'reset_permissions' as operation,
    COUNT(*) as affected_count
FROM users
WHERE student_id NOT LIKE 'AXCF202501%'
AND can_self_schedule = false;