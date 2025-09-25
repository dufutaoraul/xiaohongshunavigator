-- 🔧 处理字段差异的迁移脚本
-- 用于将开发数据库的数据迁移到生产数据库，处理字段不匹配问题

-- ==========================================
-- 第一步：检查表结构差异
-- ==========================================

-- 检查 checkin_schedules 表结构
SELECT 
    'checkin_schedules' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'checkin_schedules' 
ORDER BY ordinal_position;

-- 检查 checkin_records 表结构  
SELECT 
    'checkin_records' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
ORDER BY ordinal_position;

-- ==========================================
-- 第二步：安全的数据插入（处理字段差异）
-- ==========================================

-- 🎯 迁移 checkin_schedules 数据
-- 基于开发数据库的实际数据
INSERT INTO checkin_schedules (
    id,
    student_id,
    start_date,
    end_date,
    created_at,
    created_by,
    is_active
)
VALUES
    ('873c3051-9917-4e84-8767-d4f95d31a348', 'AXCF2025010005', '2025-05-30', '2025-08-30', '2025-08-31 13:27:36.249853+00', 'AXCF2025010006', true),
    ('6f7e810f-ddd4-4d37-9d39-a7f2d37606a4', 'AXCF2025059002', '2025-09-01', '2025-12-03', '2025-08-31 13:28:17.049191+00', 'AXCF2025010006', true),
    ('e8abdf97-3a5c-4f82-92aa-abb413981898', 'AXCF2025059003', '2025-09-01', '2025-12-03', '2025-08-31 13:28:17.049191+00', 'AXCF2025010006', true),
    ('3cf9b3ba-2103-4331-8bb2-b89430ab5df8', 'AXCF2025059005', '2025-09-01', '2025-12-03', '2025-08-31 13:28:17.049191+00', 'AXCF2025010006', true),
    ('cca0922b-8df3-4afb-bf19-bc2d25060ac5', 'AXCF2025059004', '2025-09-01', '2025-12-03', '2025-08-31 13:28:17.049191+00', 'AXCF2025010006', true),
    ('1b78ec2f-adaf-438e-8231-9a6cee0efff8', 'AXCF2025059001', '2025-09-01', '2025-12-03', '2025-08-31 13:28:17.049191+00', 'AXCF2025010006', true),
    ('200d4f70-732d-4812-9ff1-676b01ba4749', 'AXCF2025059007', '2025-08-25', '2025-11-26', '2025-08-31 14:42:38.80008+00', 'AXCF2025010006', true),
    ('ba216778-234c-427f-b2ab-c485900610d9', 'AXCF2025010006', '2025-09-02', '2025-12-03', '2025-09-01 00:35:35.092866+00', 'AXCF2025010006', true),
    ('7974f98d-5670-445f-80af-c8185ba72b22', 'AXCF2025010019', '2025-08-04', '2025-11-04', '2025-09-02 00:15:44.523168+00', 'AXCF2025010006', true),
    ('36a17026-9634-4795-94ff-da6a1136fe25', 'AXCF2025010001', '2025-08-23', '2025-11-23', '2025-09-02 01:53:27.107432+00', 'AXCF2025010006', true),
    ('9119c800-9d25-4c52-bcde-a462cc53274d', 'AXCF2025010002', '2025-08-23', '2025-11-23', '2025-09-02 01:53:27.107432+00', 'AXCF2025010006', true),
    ('605bb010-3a90-4139-8f60-c142152cb317', 'AXCF2025010003', '2025-08-23', '2025-11-23', '2025-09-02 01:53:27.107432+00', 'AXCF2025010006', true)
ON CONFLICT (id) DO NOTHING;

-- 🎯 迁移 checkin_records 数据
-- 只插入确定存在的字段
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
    -- 这里需要替换为从开发数据库导出的实际数据
    -- 示例格式：
    -- ('record_id', 'student_id', 'plan_id', '2025-01-01', 'https://xiaohongshu.com/...', '2025-01-01 12:00:00+00', 'approved', '审核通过', '2025-01-01 12:00:00+00', '2025-01-01 12:00:00+00', '标题', '描述', '学员姓名', 'https://xiaohongshu.com/...')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 第三步：验证迁移结果
-- ==========================================

-- 检查迁移后的数据量
SELECT 
    'checkin_schedules' as table_name, 
    COUNT(*) as total_count,
    COUNT(CASE WHEN student_id IN ('AXCF2025059002', 'AXCF2025059003', 'AXCF2025059005', 'AXCF2025059004', 'AXCF2025059001', 'AXCF2025059007') THEN 1 END) as migrated_count
FROM checkin_schedules
UNION ALL
SELECT 
    'checkin_records' as table_name, 
    COUNT(*) as total_count,
    COUNT(CASE WHEN student_id IN ('AXCF2025059002', 'AXCF2025059003', 'AXCF2025059005', 'AXCF2025059004', 'AXCF2025059001', 'AXCF2025059007') THEN 1 END) as migrated_count
FROM checkin_records;

-- 检查具体的迁移数据
SELECT 'checkin_schedules' as table_name, id, student_id, start_date, end_date, is_active
FROM checkin_schedules 
WHERE student_id IN ('AXCF2025059002', 'AXCF2025059003', 'AXCF2025059005', 'AXCF2025059004', 'AXCF2025059001', 'AXCF2025059007')
ORDER BY student_id;

-- ==========================================
-- 故障排除指南
-- ==========================================

/*
如果遇到字段不存在的错误：

1. 错误：column "某字段名" does not exist
   解决：从 INSERT 语句中移除该字段，从 VALUES 中移除对应值

2. 错误：null value in column "某字段名" violates not-null constraint
   解决：为该字段提供默认值，或检查该字段是否为必填

3. 错误：duplicate key value violates unique constraint
   解决：检查是否有重复的 id，使用 ON CONFLICT DO NOTHING 或 DO UPDATE

常用的字段映射：
- 如果生产数据库有 username 字段但开发数据库没有，可以用 student_id 作为默认值
- 如果生产数据库有额外的时间戳字段，可以用 NOW() 作为默认值
- 如果生产数据库有额外的状态字段，可以用合理的默认值
*/
