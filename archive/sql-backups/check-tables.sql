-- 检查开发数据库中的所有表
-- 在开发数据库中执行此查询

-- =====================================================
-- 查看所有表名
-- =====================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =====================================================
-- 查看所有表的详细信息
-- =====================================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
