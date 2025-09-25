-- 🔍 立即检查users表相关的数据库依赖
-- 在Supabase控制台直接执行这些查询

-- 1. 检查users表的触发器
SELECT
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'public';

-- 2. 检查users表的RLS策略
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
AND schemaname = 'public';

-- 3. 检查是否有函数引用了self_schedule_permissions
SELECT
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_definition LIKE '%self_schedule_permissions%';

-- 4. 检查是否有视图引用了这个表
SELECT
    table_name,
    view_definition
FROM information_schema.views
WHERE view_definition LIKE '%self_schedule_permissions%'
AND table_schema = 'public';

-- 5. 检查users表当前结构
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. 测试简单的users表查询
SELECT COUNT(*) as user_count FROM users;

-- 7. 测试简单的INSERT（如果没有数据冲突）
-- 注意：这个可能会失败，但能帮我们定位问题
/*
INSERT INTO users (student_id, name, real_name, persona, keywords, vision, role)
VALUES ('TEST_DEBUG_001', '测试用户', '测试真实姓名', '测试人设', '测试关键词', '测试愿景', 'student')
ON CONFLICT (student_id) DO UPDATE SET
    name = EXCLUDED.name,
    real_name = EXCLUDED.real_name,
    persona = EXCLUDED.persona,
    keywords = EXCLUDED.keywords,
    vision = EXCLUDED.vision;
*/