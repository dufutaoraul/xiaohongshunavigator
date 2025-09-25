-- 设置数据库级联删除关系
-- 当删除 users 表中的学员时，自动删除其他表中相关的数据

-- 1. 首先查看现有的外键约束
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (ccu.table_name = 'users' OR tc.table_name IN (
    'checkin_schedules', 
    'checkin_records', 
    'homework_submissions', 
    'homework_grades'
  ));

-- 2. 删除现有的外键约束（如果存在）
-- checkin_schedules 表
ALTER TABLE checkin_schedules 
DROP CONSTRAINT IF EXISTS checkin_schedules_student_id_fkey;

-- checkin_records 表
ALTER TABLE checkin_records 
DROP CONSTRAINT IF EXISTS checkin_records_student_id_fkey;

-- homework_submissions 表
ALTER TABLE homework_submissions 
DROP CONSTRAINT IF EXISTS homework_submissions_student_id_fkey;

-- homework_grades 表
ALTER TABLE homework_grades 
DROP CONSTRAINT IF EXISTS homework_grades_student_id_fkey;

-- 3. 重新创建带有 CASCADE DELETE 的外键约束

-- checkin_schedules 表：当删除用户时，删除其打卡安排
ALTER TABLE checkin_schedules 
ADD CONSTRAINT checkin_schedules_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(student_id) 
ON DELETE CASCADE;

-- checkin_records 表：当删除用户时，删除其打卡记录
ALTER TABLE checkin_records 
ADD CONSTRAINT checkin_records_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(student_id) 
ON DELETE CASCADE;

-- homework_submissions 表：当删除用户时，删除其作业提交记录
ALTER TABLE homework_submissions 
ADD CONSTRAINT homework_submissions_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(student_id) 
ON DELETE CASCADE;

-- homework_grades 表：当删除用户时，删除其作业评分记录
ALTER TABLE homework_grades 
ADD CONSTRAINT homework_grades_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(student_id) 
ON DELETE CASCADE;

-- 4. 验证新的约束是否正确创建
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- 5. 测试级联删除（可选，仅用于验证）
-- 注意：这会删除测试数据，请谨慎使用
-- DELETE FROM users WHERE student_id = 'TEST_STUDENT_ID';
