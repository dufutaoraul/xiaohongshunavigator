-- 打卡计划表
CREATE TABLE IF NOT EXISTS checkin_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_days INTEGER NOT NULL DEFAULT 90,
  completed_days INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 打卡记录表
CREATE TABLE IF NOT EXISTS checkin_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  plan_id UUID REFERENCES checkin_plans(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  xhs_url TEXT NOT NULL,
  post_publish_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('valid', 'invalid', 'pending')),
  admin_review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, plan_id, checkin_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_plans_student_id ON checkin_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_checkin_plans_status ON checkin_plans(status);
CREATE INDEX IF NOT EXISTS idx_checkin_records_student_id ON checkin_records(student_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_plan_id ON checkin_records(plan_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_date ON checkin_records(checkin_date);
CREATE INDEX IF NOT EXISTS idx_checkin_records_status ON checkin_records(status);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_checkin_plans_updated_at BEFORE UPDATE ON checkin_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checkin_records_updated_at BEFORE UPDATE ON checkin_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加RLS策略（如果需要）
ALTER TABLE checkin_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_records ENABLE ROW LEVEL SECURITY;

-- 允许所有操作（简化版，生产环境需要更严格的策略）
CREATE POLICY "Allow all operations on checkin_plans" ON checkin_plans FOR ALL USING (true);
CREATE POLICY "Allow all operations on checkin_records" ON checkin_records FOR ALL USING (true);
