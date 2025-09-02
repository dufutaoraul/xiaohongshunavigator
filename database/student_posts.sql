-- 学员帖子数据表
CREATE TABLE IF NOT EXISTS student_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  student_name VARCHAR(100),
  post_id VARCHAR(100) UNIQUE,
  post_url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  cover_image_url TEXT,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  publish_time TIMESTAMP WITH TIME ZONE,
  crawl_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_student_posts_student_id ON student_posts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_posts_like_count ON student_posts(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_student_posts_publish_time ON student_posts(publish_time DESC);
CREATE INDEX IF NOT EXISTS idx_student_posts_post_id ON student_posts(post_id);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_student_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_posts_updated_at 
BEFORE UPDATE ON student_posts 
FOR EACH ROW EXECUTE FUNCTION update_student_posts_updated_at();

-- 添加RLS策略
ALTER TABLE student_posts ENABLE ROW LEVEL SECURITY;

-- 允许所有操作（简化版，生产环境需要更严格的策略）
CREATE POLICY "Allow all operations on student_posts" ON student_posts FOR ALL USING (true);

-- 学员数据统计视图
CREATE OR REPLACE VIEW student_post_stats AS
SELECT 
  student_id,
  student_name,
  COUNT(*) as total_posts,
  SUM(like_count) as total_likes,
  SUM(comment_count) as total_comments,
  SUM(view_count) as total_views,
  AVG(like_count) as avg_likes,
  MAX(like_count) as max_likes,
  MAX(publish_time) as latest_post_time,
  MIN(publish_time) as first_post_time
FROM student_posts 
GROUP BY student_id, student_name;

-- 热门帖子视图（用于轮播）
CREATE OR REPLACE VIEW hot_posts AS
SELECT 
  sp.*,
  -- 综合热度分数：点赞数 * 0.6 + 评论数 * 0.3 + 浏览数 * 0.1
  (like_count * 0.6 + comment_count * 0.3 + view_count * 0.1) as hot_score,
  -- 最近一个月的帖子加权
  CASE 
    WHEN publish_time > NOW() - INTERVAL '30 days' THEN 1.5
    ELSE 1.0
  END as recency_weight
FROM student_posts sp
WHERE like_count > 0 OR comment_count > 0
ORDER BY 
  (like_count * 0.6 + comment_count * 0.3 + view_count * 0.1) * 
  CASE 
    WHEN publish_time > NOW() - INTERVAL '30 days' THEN 1.5
    ELSE 1.0
  END DESC;

-- 学员最佳帖子视图
CREATE OR REPLACE VIEW student_best_posts AS
SELECT DISTINCT ON (student_id)
  student_id,
  student_name,
  post_id,
  post_url,
  title,
  cover_image_url,
  like_count,
  comment_count,
  view_count,
  publish_time
FROM student_posts
ORDER BY student_id, like_count DESC, comment_count DESC;
