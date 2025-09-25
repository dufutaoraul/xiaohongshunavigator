-- 数据库迁移：添加学员自主设定打卡时间功能
-- 执行时间：2025-09-03

-- 1. 为users表添加自主设定权限字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_self_schedule boolean DEFAULT false;

-- 2. 为users表添加自主设定截止时间字段（买课时间+6个月）
ALTER TABLE users ADD COLUMN IF NOT EXISTS self_schedule_deadline timestamp;

-- 3. 为users表添加是否已使用自主设定机会字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_used_self_schedule boolean DEFAULT false;

-- 4. 创建批量权限范围表
CREATE TABLE IF NOT EXISTS self_schedule_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_student_id text NOT NULL,
  end_student_id text NOT NULL,
  created_by text NOT NULL,
  created_at timestamp DEFAULT now(),
  is_active boolean DEFAULT true
);

-- 5. 为checkin_schedules表添加设置类型字段
ALTER TABLE checkin_schedules ADD COLUMN IF NOT EXISTS schedule_type text DEFAULT 'admin_set';
-- 可能的值：'admin_set' (管理员设置), 'self_set' (学员自主设置)

-- 6. 更新现有用户的自主设定截止时间（买课时间+6个月）
UPDATE users 
SET self_schedule_deadline = created_at + INTERVAL '6 months'
WHERE self_schedule_deadline IS NULL;

-- 7. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_can_self_schedule ON users(can_self_schedule);
CREATE INDEX IF NOT EXISTS idx_users_self_schedule_deadline ON users(self_schedule_deadline);
CREATE INDEX IF NOT EXISTS idx_self_schedule_ranges_student_ids ON self_schedule_ranges(start_student_id, end_student_id);

-- 8. 添加注释
COMMENT ON COLUMN users.can_self_schedule IS '是否允许学员自主设定打卡时间';
COMMENT ON COLUMN users.self_schedule_deadline IS '自主设定打卡时间的截止日期（买课时间+6个月）';
COMMENT ON COLUMN users.has_used_self_schedule IS '是否已使用过自主设定机会（只能设置一次）';
COMMENT ON TABLE self_schedule_ranges IS '批量设置自主权限的学号范围';
COMMENT ON COLUMN checkin_schedules.schedule_type IS '打卡安排设置类型：admin_set=管理员设置，self_set=学员自主设置';
