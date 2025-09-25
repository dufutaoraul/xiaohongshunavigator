-- 为用户表添加password字段的SQL脚本
-- 请在Supabase Dashboard的SQL编辑器中执行此脚本

-- 1. 添加password字段到users表
ALTER TABLE public.users
ADD COLUMN password TEXT DEFAULT NULL;

-- 2. 为现有用户设置默认密码（与学号相同）
-- 这将把密码初始化为与学号相同的值
UPDATE public.users
SET password = student_id
WHERE password IS NULL;

-- 3. 添加注释说明password字段的用途
COMMENT ON COLUMN public.users.password IS '用户密码，初始默认与学号相同，用户可以修改';

-- 4. 创建索引以提高查询性能（可选）
CREATE INDEX IF NOT EXISTS idx_users_student_id_password 
ON public.users(student_id, password);

-- 5. 验证字段已正确添加
-- 执行以下查询检查结果
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name = 'password';

-- 6. 查看示例数据
SELECT 
  id, 
  student_id, 
  password,
  created_at
FROM public.users
LIMIT 5;

-- 执行说明:
-- 1. 在Supabase Dashboard中打开SQL编辑器
-- 2. 复制粘贴此脚本
-- 3. 点击执行按钮
-- 4. 检查执行结果确认字段已正确添加
-- 5. 现有用户的密码将自动设为与学号相同