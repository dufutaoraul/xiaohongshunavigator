-- =====================================================
-- 生产数据库迁移验证脚本
-- 用于验证迁移是否成功完成
-- =====================================================

SELECT '🔍 开始验证生产数据库迁移结果...' as status;

-- =====================================================
-- 第一步：检查表是否存在
-- =====================================================

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ users 表存在'
        ELSE '❌ users 表不存在'
    END as users_table_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkin_schedules') 
        THEN '✅ checkin_schedules 表存在'
        ELSE '❌ checkin_schedules 表不存在'
    END as schedules_table_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkin_records') 
        THEN '✅ checkin_records 表存在'
        ELSE '❌ checkin_records 表不存在'
    END as records_table_status;

-- =====================================================
-- 第二步：检查 users 表字段
-- =====================================================

SELECT '📋 检查 users 表字段结构...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 检查关键字段是否存在
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'real_name'
        ) 
        THEN '✅ users.real_name 字段存在'
        ELSE '❌ users.real_name 字段缺失'
    END as real_name_status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'xiaohongshu_profile_url'
        ) 
        THEN '✅ users.xiaohongshu_profile_url 字段存在'
        ELSE '❌ users.xiaohongshu_profile_url 字段缺失'
    END as profile_url_status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
        ) 
        THEN '✅ users.role 字段存在'
        ELSE '❌ users.role 字段缺失'
    END as role_status;

-- =====================================================
-- 第三步：检查 checkin_schedules 表结构
-- =====================================================

SELECT '📋 检查 checkin_schedules 表字段结构...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checkin_schedules' 
ORDER BY ordinal_position;

-- =====================================================
-- 第四步：检查 checkin_records 表结构
-- =====================================================

SELECT '📋 检查 checkin_records 表字段结构...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
ORDER BY ordinal_position;

-- =====================================================
-- 第五步：检查索引
-- =====================================================

SELECT '📋 检查索引创建情况...' as status;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('users', 'checkin_schedules', 'checkin_records')
ORDER BY tablename, indexname;

-- =====================================================
-- 第六步：检查外键约束
-- =====================================================

SELECT '📋 检查外键约束...' as status;

SELECT 
    tc.constraint_name,
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
    AND tc.table_name IN ('checkin_schedules', 'checkin_records');

-- =====================================================
-- 第七步：检查 RLS 策略
-- =====================================================

SELECT '📋 检查 RLS 策略...' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('checkin_schedules', 'checkin_records');

-- =====================================================
-- 第八步：检查数据记录数
-- =====================================================

SELECT '📊 检查数据记录数...' as status;

-- 检查 users 表记录数（应该保持原有的 268 条记录）
SELECT 
    'users' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) >= 268 THEN '✅ 数据完整'
        ELSE '⚠️ 数据可能丢失'
    END as data_status
FROM users;

-- 检查新表记录数（应该为 0，因为是新创建的）
SELECT 
    'checkin_schedules' as table_name,
    COUNT(*) as record_count,
    '✅ 新表' as data_status
FROM checkin_schedules;

SELECT 
    'checkin_records' as table_name,
    COUNT(*) as record_count,
    '✅ 新表' as data_status
FROM checkin_records;

-- =====================================================
-- 第九步：检查用户角色分布
-- =====================================================

SELECT '📊 检查用户角色分布...' as status;

SELECT 
    COALESCE(role, 'NULL') as role,
    COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY count DESC;

-- =====================================================
-- 第十步：最终验证总结
-- =====================================================

SELECT '🎯 迁移验证总结...' as status;

DO $$
DECLARE
    users_count INTEGER;
    schedules_exists BOOLEAN;
    records_exists BOOLEAN;
    required_fields_exist BOOLEAN;
BEGIN
    -- 检查用户数据
    SELECT COUNT(*) INTO users_count FROM users;
    
    -- 检查表是否存在
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkin_schedules') INTO schedules_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkin_records') INTO records_exists;
    
    -- 检查关键字段是否存在
    SELECT (
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'real_name') AND
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'xiaohongshu_profile_url') AND
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role')
    ) INTO required_fields_exist;
    
    -- 输出验证结果
    RAISE NOTICE '=== 迁移验证结果 ===';
    RAISE NOTICE '👥 用户数据: % 条记录 %', users_count, 
        CASE WHEN users_count >= 268 THEN '✅' ELSE '❌' END;
    RAISE NOTICE '📅 打卡计划表: %', 
        CASE WHEN schedules_exists THEN '✅ 已创建' ELSE '❌ 创建失败' END;
    RAISE NOTICE '📝 打卡记录表: %', 
        CASE WHEN records_exists THEN '✅ 已创建' ELSE '❌ 创建失败' END;
    RAISE NOTICE '🔧 必需字段: %', 
        CASE WHEN required_fields_exist THEN '✅ 完整' ELSE '❌ 缺失' END;
    
    IF users_count >= 268 AND schedules_exists AND records_exists AND required_fields_exist THEN
        RAISE NOTICE '🎉 迁移验证通过！数据库已成功升级。';
    ELSE
        RAISE NOTICE '⚠️ 迁移验证发现问题，请检查上述输出。';
    END IF;
END $$;

SELECT '✅ 验证脚本执行完成' as final_status;
