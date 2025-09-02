-- =====================================================
-- 生产数据库迁移脚本
-- 目标：将开发数据库的表结构同步到生产数据库
-- 注意：只新增表和字段，不删除任何现有数据
-- =====================================================

-- 检查当前环境
SELECT 'Starting migration for ai-xiaohongshu-navigator database' as status;

-- =====================================================
-- 第一步：更新 users 表结构（添加缺失字段）
-- =====================================================

-- 检查并添加缺失的字段到 users 表
DO $$
BEGIN
    -- 添加 real_name 字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'real_name'
    ) THEN
        ALTER TABLE users ADD COLUMN real_name TEXT;
        RAISE NOTICE '✅ 添加 users.real_name 字段';
    ELSE
        RAISE NOTICE '⚠️ users.real_name 字段已存在';
    END IF;

    -- 确保 xiaohongshu_profile_url 字段存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'xiaohongshu_profile_url'
    ) THEN
        ALTER TABLE users ADD COLUMN xiaohongshu_profile_url TEXT;
        RAISE NOTICE '✅ 添加 users.xiaohongshu_profile_url 字段';
    ELSE
        RAISE NOTICE '⚠️ users.xiaohongshu_profile_url 字段已存在';
    END IF;

    -- 确保 role 字段存在且有默认值
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin'));
        RAISE NOTICE '✅ 添加 users.role 字段';
    ELSE
        RAISE NOTICE '⚠️ users.role 字段已存在';
    END IF;
END $$;

-- =====================================================
-- 第二步：创建 checkin_schedules 表
-- =====================================================

CREATE TABLE IF NOT EXISTS checkin_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT NOT NULL, -- 创建者（管理员学号）
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(student_id, start_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_student_id ON checkin_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_dates ON checkin_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_active ON checkin_schedules(is_active);

-- 添加外键约束（如果 users 表使用 student_id 作为引用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_checkin_schedules_student_id'
    ) THEN
        ALTER TABLE checkin_schedules 
        ADD CONSTRAINT fk_checkin_schedules_student_id 
        FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE;
        RAISE NOTICE '✅ 添加 checkin_schedules 外键约束';
    END IF;
END $$;

-- =====================================================
-- 第三步：创建 checkin_records 表
-- =====================================================

CREATE TABLE IF NOT EXISTS checkin_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    plan_id UUID, -- 关联到 checkin_schedules，但设为可选以保持灵活性
    checkin_date DATE NOT NULL,
    xhs_url TEXT NOT NULL, -- 主要的小红书链接字段
    xiaohongshu_url TEXT, -- 备用字段，保持兼容性
    post_publish_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'invalid', 'pending')),
    admin_review_notes TEXT,
    content_title TEXT, -- 内容标题（可选）
    content_description TEXT, -- 内容描述（可选）
    student_name TEXT, -- 学员姓名（冗余字段，便于查询）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, checkin_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_records_student_id ON checkin_records(student_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_plan_id ON checkin_records(plan_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_date ON checkin_records(checkin_date);
CREATE INDEX IF NOT EXISTS idx_checkin_records_status ON checkin_records(status);

-- 添加外键约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_checkin_records_student_id'
    ) THEN
        ALTER TABLE checkin_records 
        ADD CONSTRAINT fk_checkin_records_student_id 
        FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE;
        RAISE NOTICE '✅ 添加 checkin_records 外键约束';
    END IF;
END $$;

-- =====================================================
-- 第四步：创建更新时间触发器
-- =====================================================

-- 创建更新时间函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 checkin_records 表添加更新时间触发器
DROP TRIGGER IF EXISTS update_checkin_records_updated_at ON checkin_records;
CREATE TRIGGER update_checkin_records_updated_at 
    BEFORE UPDATE ON checkin_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 第五步：设置 RLS 策略（行级安全）
-- =====================================================

-- 启用 RLS
ALTER TABLE checkin_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_records ENABLE ROW LEVEL SECURITY;

-- 创建宽松的策略（允许所有操作，后续可以根据需要收紧）
DROP POLICY IF EXISTS "Allow all operations on checkin_schedules" ON checkin_schedules;
CREATE POLICY "Allow all operations on checkin_schedules" 
    ON checkin_schedules FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on checkin_records" ON checkin_records;
CREATE POLICY "Allow all operations on checkin_records" 
    ON checkin_records FOR ALL USING (true);

-- =====================================================
-- 第六步：添加表和字段注释
-- =====================================================

COMMENT ON TABLE checkin_schedules IS '打卡时间安排表，管理员设置学员的打卡周期';
COMMENT ON TABLE checkin_records IS '打卡记录表，存储学员每日打卡的小红书链接';

COMMENT ON COLUMN checkin_schedules.student_id IS '学员学号，关联 users 表';
COMMENT ON COLUMN checkin_schedules.start_date IS '打卡开始日期';
COMMENT ON COLUMN checkin_schedules.end_date IS '打卡结束日期';
COMMENT ON COLUMN checkin_schedules.created_by IS '创建者（管理员学号）';
COMMENT ON COLUMN checkin_schedules.is_active IS '是否激活状态';

COMMENT ON COLUMN checkin_records.student_id IS '学员学号，关联 users 表';
COMMENT ON COLUMN checkin_records.plan_id IS '关联的打卡计划ID';
COMMENT ON COLUMN checkin_records.checkin_date IS '打卡日期';
COMMENT ON COLUMN checkin_records.xhs_url IS '小红书链接（主要字段）';
COMMENT ON COLUMN checkin_records.xiaohongshu_url IS '小红书链接（备用字段）';
COMMENT ON COLUMN checkin_records.status IS '打卡状态：valid-有效, invalid-无效, pending-待审核';

-- =====================================================
-- 第七步：验证迁移结果
-- =====================================================

DO $$
DECLARE
    users_count INTEGER;
    schedules_count INTEGER;
    records_count INTEGER;
BEGIN
    -- 检查 users 表记录数
    SELECT COUNT(*) INTO users_count FROM users;
    
    -- 检查新表是否创建成功
    SELECT COUNT(*) INTO schedules_count FROM checkin_schedules;
    SELECT COUNT(*) INTO records_count FROM checkin_records;
    
    RAISE NOTICE '✅ 迁移完成！';
    RAISE NOTICE '📊 users 表记录数: %', users_count;
    RAISE NOTICE '📊 checkin_schedules 表记录数: %', schedules_count;
    RAISE NOTICE '📊 checkin_records 表记录数: %', records_count;
    
    -- 验证表结构
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkin_schedules') THEN
        RAISE EXCEPTION '❌ checkin_schedules 表创建失败';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkin_records') THEN
        RAISE EXCEPTION '❌ checkin_records 表创建失败';
    END IF;
    
    RAISE NOTICE '🎉 所有表结构验证通过！';
END $$;

SELECT 'Migration completed successfully!' as final_status;
