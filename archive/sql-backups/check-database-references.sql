-- 🔍 检查数据库中是否还有对self_schedule_permissions的引用

-- 1. 检查是否还有这个表存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%self_schedule%';

-- 2. 检查触发器中是否有引用
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%self_schedule_permissions%';

-- 3. 检查视图中是否有引用
SELECT table_name, view_definition
FROM information_schema.views
WHERE view_definition LIKE '%self_schedule_permissions%';

-- 4. 检查函数中是否有引用
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%self_schedule_permissions%'
AND routine_type = 'FUNCTION';

-- 5. 检查RLS策略
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE qual LIKE '%self_schedule_permissions%'
OR with_check LIKE '%self_schedule_permissions%';

-- 6. 检查外键约束
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (ccu.table_name = 'self_schedule_permissions' OR tc.table_name = 'self_schedule_permissions');

-- 7. 检查当前存在的表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;