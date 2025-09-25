-- =====================================================
-- 测试数据迁移脚本
-- 从开发数据库迁移测试数据到生产数据库
-- =====================================================

-- 注意：请先在开发数据库中导出数据，然后在生产数据库中执行此脚本

-- =====================================================
-- 第一步：清理可能的冲突数据（可选）
-- =====================================================

-- 如果需要清理现有测试数据，取消注释以下行
-- DELETE FROM checkin_records WHERE student_id LIKE 'TEST%' OR student_id LIKE 'AXCF%';
-- DELETE FROM checkin_schedules WHERE student_id LIKE 'TEST%' OR student_id LIKE 'AXCF%';

-- =====================================================
-- 第二步：迁移 checkin_schedules 数据
-- =====================================================

-- 从开发数据库导出的 checkin_schedules 数据
-- 请替换为实际的开发数据库数据

INSERT INTO checkin_schedules (id, student_id, start_date, end_date, created_at, created_by, is_active)
VALUES 
-- 示例数据，请替换为开发数据库的实际数据
('1b78ec2f-adaf-438e-8231-9a6cee0efff8', 'AXCF2025050001', '2025-09-01', '2025-12-03', '2025-08-31T13:28:17.049191+00:00', 'AXCF2025010006', true),
('b92a3e5f-7462-4ab5-847a-3857267f7695', 'AXCF2025010006', '2025-08-15', '2025-11-16', '2025-08-29T01:20:00.000000+00:00', 'AXCF2025010003', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 第三步：迁移 checkin_records 数据
-- =====================================================

-- 从开发数据库导出的 checkin_records 数据
-- 请替换为实际的开发数据库数据

INSERT INTO checkin_records (
    id, 
    student_id, 
    plan_id, 
    checkin_date, 
    xhs_url, 
    post_publish_time, 
    status, 
    admin_review_notes, 
    created_at, 
    updated_at, 
    content_title, 
    content_description, 
    student_name, 
    xiaohongshu_url
)
VALUES 
-- 示例数据，请替换为开发数据库的实际数据
(
    '39b07a65-6b5d-450b-8d79-a2a32b83d386',
    'AXCF2025010006',
    'b92a3e5f-7462-4ab5-847a-3857267f7695',
    '2025-08-29',
    'https://www.xiaohongshu.com/explore/68ad9b60000000001c00d7d4?xsec_token=ABmFbxi5lQyLO6CZejjh3LGAznZ54fRNl-8_FXL-cNDZE=&xsec_source=pc_feed',
    NULL,
    'valid',
    NULL,
    '2025-08-29T01:24:08.687908+00:00',
    '2025-08-29T01:24:08.687908+00:00',
    NULL,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 第四步：验证迁移结果
-- =====================================================

-- 检查迁移的数据
SELECT '📊 checkin_schedules 迁移结果:' as status;
SELECT 
    student_id,
    start_date,
    end_date,
    created_by,
    is_active
FROM checkin_schedules 
ORDER BY created_at DESC;

SELECT '📊 checkin_records 迁移结果:' as status;
SELECT 
    student_id,
    checkin_date,
    status,
    LEFT(xhs_url, 50) || '...' as xhs_url_preview
FROM checkin_records 
ORDER BY created_at DESC;

-- 统计信息
SELECT 
    'checkin_schedules' as table_name,
    COUNT(*) as total_records
FROM checkin_schedules
UNION ALL
SELECT 
    'checkin_records' as table_name,
    COUNT(*) as total_records
FROM checkin_records;

SELECT '✅ 测试数据迁移完成' as final_status;
