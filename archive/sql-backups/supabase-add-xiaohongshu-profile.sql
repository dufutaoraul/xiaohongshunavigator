-- 为用户表添加xiaohongshu_profile_url字段的SQL脚本
-- 请在Supabase Dashboard的SQL编辑器中执行此脚本

-- 1. 添加xiaohongshu_profile_url字段到users表
ALTER TABLE public.users
ADD COLUMN xiaohongshu_profile_url TEXT DEFAULT NULL;

-- 2. 添加注释说明xiaohongshu_profile_url字段的用途
COMMENT ON COLUMN public.users.xiaohongshu_profile_url IS '用户小红书主页链接，用于绑定个人主页';

-- 3. 验证字段已正确添加
-- 执行以下查询检查结果
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name = 'xiaohongshu_profile_url';

-- 4. 查看示例数据
SELECT 
  id, 
  student_id, 
  xiaohongshu_profile_url,
  created_at
FROM public.users
LIMIT 5;

-- 执行说明:
-- 1. 在Supabase Dashboard中打开SQL编辑器
-- 2. 复制粘贴此脚本
-- 3. 点击执行按钮
-- 4. 检查执行结果确认字段已正确添加
-- 5. 字段默认值为NULL，用户可以通过前端界面绑定小红书主页