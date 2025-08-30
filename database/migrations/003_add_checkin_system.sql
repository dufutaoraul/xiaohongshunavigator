-- 添加打卡系统相关表和字段
-- 执行时间: 2024-01-30

-- 1. 为学员表添加真实姓名字段
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS real_name VARCHAR(100);

-- 添加注释
COMMENT ON COLUMN students.real_name IS '真实姓名，用于生成证书';

-- 2. 创建学员打卡记录表
CREATE TABLE IF NOT EXISTS student_checkins (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  checkin_date DATE NOT NULL,
  xiaohongshu_link TEXT NOT NULL,
  link_title VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 约束
  CONSTRAINT fk_student_checkins_student_id 
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  CONSTRAINT unique_student_date 
    UNIQUE(student_id, checkin_date)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_student_checkins_student_date 
ON student_checkins(student_id, checkin_date);

CREATE INDEX IF NOT EXISTS idx_student_checkins_date 
ON student_checkins(checkin_date);

CREATE INDEX IF NOT EXISTS idx_student_checkins_created_at 
ON student_checkins(created_at);

-- 添加表注释
COMMENT ON TABLE student_checkins IS '学员打卡记录表';
COMMENT ON COLUMN student_checkins.student_id IS '学员ID，关联students表';
COMMENT ON COLUMN student_checkins.checkin_date IS '打卡日期';
COMMENT ON COLUMN student_checkins.xiaohongshu_link IS '小红书链接';
COMMENT ON COLUMN student_checkins.link_title IS '链接标题（可选）';
COMMENT ON COLUMN student_checkins.created_at IS '创建时间（实际打卡时间）';
COMMENT ON COLUMN student_checkins.updated_at IS '更新时间';

-- 3. 创建打卡统计视图
CREATE OR REPLACE VIEW student_checkin_stats AS
SELECT 
  s.student_id,
  s.nickname,
  s.real_name,
  COUNT(sc.id) as total_checkins,
  COUNT(CASE WHEN sc.checkin_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month_checkins,
  COUNT(CASE WHEN sc.checkin_date >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as week_checkins,
  MAX(sc.checkin_date) as last_checkin_date,
  MIN(sc.checkin_date) as first_checkin_date
FROM students s
LEFT JOIN student_checkins sc ON s.student_id = sc.student_id
GROUP BY s.student_id, s.nickname, s.real_name;

-- 添加视图注释
COMMENT ON VIEW student_checkin_stats IS '学员打卡统计视图';

-- 4. 创建触发器函数：自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 为student_checkins表添加触发器
DROP TRIGGER IF EXISTS update_student_checkins_updated_at ON student_checkins;
CREATE TRIGGER update_student_checkins_updated_at
    BEFORE UPDATE ON student_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 插入一些示例数据（仅用于测试）
-- 注意：在生产环境中应该删除这部分
INSERT INTO student_checkins (student_id, checkin_date, xiaohongshu_link, link_title) 
VALUES 
  ('test123', CURRENT_DATE, 'https://www.xiaohongshu.com/explore/test1', '测试打卡1'),
  ('test123', CURRENT_DATE - INTERVAL '1 day', 'https://www.xiaohongshu.com/explore/test2', '测试打卡2'),
  ('test123', CURRENT_DATE - INTERVAL '2 days', 'https://www.xiaohongshu.com/explore/test3', '测试打卡3')
ON CONFLICT (student_id, checkin_date) DO NOTHING;

-- 7. 创建用于清理过期数据的函数（可选）
CREATE OR REPLACE FUNCTION cleanup_old_checkins(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM student_checkins 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 添加函数注释
COMMENT ON FUNCTION cleanup_old_checkins(INTEGER) IS '清理指定天数之前的打卡记录';

-- 8. 验证表结构
DO $$
BEGIN
  -- 检查students表是否有real_name字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'real_name'
  ) THEN
    RAISE EXCEPTION 'real_name字段添加失败';
  END IF;
  
  -- 检查student_checkins表是否创建成功
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'student_checkins'
  ) THEN
    RAISE EXCEPTION 'student_checkins表创建失败';
  END IF;
  
  RAISE NOTICE '打卡系统数据库迁移完成！';
END $$;
