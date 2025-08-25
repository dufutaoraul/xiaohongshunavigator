-- 添加用户认证相关字段
-- 为现有的 users 表添加密码哈希和首次登录标记字段

-- 添加密码哈希字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 添加首次登录标记字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- 添加创建时间和更新时间字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 users 表添加更新时间触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为现有用户设置默认值
UPDATE users 
SET first_login = CASE 
    WHEN password = student_id THEN true 
    ELSE false 
END
WHERE first_login IS NULL;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 添加注释
COMMENT ON COLUMN users.password_hash IS '用户密码的哈希值，使用 bcrypt 加密';
COMMENT ON COLUMN users.first_login IS '是否为首次登录，用于强制修改密码';
COMMENT ON COLUMN users.created_at IS '用户创建时间';
COMMENT ON COLUMN users.updated_at IS '用户信息最后更新时间';
