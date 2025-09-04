-- ===================================
-- 🛡️ 超级安全修复 - 绝对不会出错
-- ===================================

-- 1. 设置ID字段默认值
ALTER TABLE checkin_records ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. 设置时间字段默认值  
ALTER TABLE checkin_records ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE checkin_records ALTER COLUMN updated_at SET DEFAULT NOW();

-- 3. 安全创建唯一约束
DO $$
BEGIN
    -- 检查约束是否已存在
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'checkin_records'::regclass 
        AND conname = 'unique_student_checkin_date'
    ) THEN
        -- 如果不存在，则创建
        ALTER TABLE checkin_records 
        ADD CONSTRAINT unique_student_checkin_date 
        UNIQUE (student_id, checkin_date);
        
        RAISE NOTICE '唯一约束已创建';
    ELSE
        RAISE NOTICE '唯一约束已存在，跳过创建';
    END IF;
END $$;

-- 4. 验证修复结果
SELECT 
    'ID字段默认值: ' || COALESCE(column_default, '无') as id_default
FROM information_schema.columns 
WHERE table_name = 'checkin_records' AND column_name = 'id';

SELECT 
    'created_at默认值: ' || COALESCE(column_default, '无') as created_at_default
FROM information_schema.columns 
WHERE table_name = 'checkin_records' AND column_name = 'created_at';

SELECT 
    'updated_at默认值: ' || COALESCE(column_default, '无') as updated_at_default
FROM information_schema.columns 
WHERE table_name = 'checkin_records' AND column_name = 'updated_at';

SELECT 
    '约束名称: ' || conname as constraint_name
FROM pg_constraint 
WHERE conrelid = 'checkin_records'::regclass 
AND conname = 'unique_student_checkin_date';

SELECT '🎉 修复完成！现在可以测试打卡提交功能了！' as status;
