-- ===================================
-- 🚀 最简单修复 - 一键执行
-- ===================================

-- 1. 设置ID字段默认值
ALTER TABLE checkin_records ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. 设置时间字段默认值  
ALTER TABLE checkin_records ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE checkin_records ALTER COLUMN updated_at SET DEFAULT NOW();

-- 3. 创建唯一约束（先删除再创建，避免重复）
ALTER TABLE checkin_records DROP CONSTRAINT IF EXISTS unique_student_checkin_date;
ALTER TABLE checkin_records ADD CONSTRAINT unique_student_checkin_date UNIQUE (student_id, checkin_date);

-- 4. 验证修复
SELECT '修复完成！' as status;
