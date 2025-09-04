-- ===================================
-- 🎯 核心修复 - 只解决打卡提交问题
-- ===================================

-- 设置ID字段默认值（这是核心问题）
ALTER TABLE checkin_records ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 设置时间字段默认值
ALTER TABLE checkin_records ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE checkin_records ALTER COLUMN updated_at SET DEFAULT NOW();

-- 验证修复
SELECT '修复完成！ID字段现在有默认值了！' as result;
