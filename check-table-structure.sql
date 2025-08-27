-- 检查当前 assignments 表的结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'assignments';