-- ===================================
-- 🚀 最终数据迁移脚本 - 基于实际表结构
-- ===================================

-- =====================================================
-- 🔥 第1步：在生产数据库执行（删除旧表）
-- =====================================================
DROP TABLE IF EXISTS checkin_records CASCADE;
DROP TABLE IF EXISTS checkin_schedules CASCADE;

-- =====================================================
-- 🏗️ 第2步：在生产数据库执行（创建新表）
-- =====================================================

-- 2.1 创建 checkin_schedules 表
CREATE TABLE checkin_schedules (
    id uuid NOT NULL,
    student_id text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by text NOT NULL,
    is_active boolean DEFAULT true
);

-- 2.2 创建 checkin_records 表
CREATE TABLE checkin_records (
    id uuid NOT NULL,
    student_id character varying NOT NULL,
    plan_id uuid,
    checkin_date date NOT NULL,
    xhs_url text NOT NULL,
    post_publish_time timestamp with time zone,
    status character varying NOT NULL,
    admin_review_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    content_title text,
    content_description text,
    student_name text,
    xiaohongshu_url text
);

-- =====================================================
-- 📊 第3步：在开发数据库执行（导出数据）
-- =====================================================

-- 3.1 导出 checkin_schedules 数据
SELECT '=== checkin_schedules INSERT 语句 ===' as info;
SELECT 
    'INSERT INTO checkin_schedules (id, student_id, start_date, end_date, created_at, created_by, is_active) VALUES ' ||
    string_agg(
        '(''' || id || ''', ''' || student_id || ''', ''' || start_date || ''', ''' || 
        end_date || ''', ''' || created_at || ''', ''' || created_by || ''', ' || 
        COALESCE(is_active::text, 'true') || ')',
        ', '
    ) || ';'
FROM checkin_schedules;

-- 3.2 导出 checkin_records 数据
SELECT '=== checkin_records INSERT 语句 ===' as info;
SELECT 
    'INSERT INTO checkin_records (id, student_id, plan_id, checkin_date, xhs_url, post_publish_time, status, admin_review_notes, created_at, updated_at, content_title, content_description, student_name, xiaohongshu_url) VALUES ' ||
    string_agg(
        '(''' || id || ''', ''' || student_id || ''', ' || 
        COALESCE('''' || plan_id || '''', 'NULL') || ', ''' || 
        checkin_date || ''', ''' || xhs_url || ''', ' ||
        COALESCE('''' || post_publish_time || '''', 'NULL') || ', ''' ||
        status || ''', ' || 
        COALESCE('''' || admin_review_notes || '''', 'NULL') || ', ''' ||
        created_at || ''', ''' || updated_at || ''', ' ||
        COALESCE('''' || content_title || '''', 'NULL') || ', ' ||
        COALESCE('''' || content_description || '''', 'NULL') || ', ' ||
        COALESCE('''' || student_name || '''', 'NULL') || ', ' ||
        COALESCE('''' || xiaohongshu_url || '''', 'NULL') || ')',
        ', '
    ) || ';'
FROM checkin_records;

-- =====================================================
-- ✅ 第4步：在生产数据库执行（验证）
-- =====================================================
SELECT 'checkin_schedules 记录数:' as info, COUNT(*) as count FROM checkin_schedules;
SELECT 'checkin_records 记录数:' as info, COUNT(*) as count FROM checkin_records;

-- =====================================================
-- 📋 操作步骤总结
-- =====================================================
/*
🎯 最终操作步骤：

1️⃣ 在生产数据库执行第1步（删除旧表）
2️⃣ 在生产数据库执行第2步（创建新表）
3️⃣ 在开发数据库执行第3步（生成INSERT语句）
4️⃣ 复制生成的INSERT语句到生产数据库执行
5️⃣ 在生产数据库执行第4步（验证结果）

🎉 完成！
*/
