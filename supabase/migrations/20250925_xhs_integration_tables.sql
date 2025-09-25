-- 小红书集成功能数据表
-- 用于缓存小红书帖子数据和用户信息，减少重复抓取

-- =====================================================
-- 第一步：创建小红书用户缓存表 (xhs_users_cache)
-- =====================================================
CREATE TABLE IF NOT EXISTS xhs_users_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,              -- 小红书用户ID
  nickname TEXT NOT NULL,                    -- 用户昵称
  description TEXT DEFAULT '',               -- 用户简介
  avatar_url TEXT,                          -- 头像URL
  followers_count INTEGER DEFAULT 0,        -- 粉丝数
  following_count INTEGER DEFAULT 0,        -- 关注数
  likes_count INTEGER DEFAULT 0,           -- 获赞数
  profile_url TEXT,                        -- 主页链接
  is_active BOOLEAN DEFAULT TRUE,          -- 是否活跃用户
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_user_id_format CHECK (user_id ~ '^[a-zA-Z0-9]+$')
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_xhs_users_cache_user_id ON xhs_users_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_xhs_users_cache_nickname ON xhs_users_cache(nickname);
CREATE INDEX IF NOT EXISTS idx_xhs_users_cache_updated ON xhs_users_cache(last_updated_at);

-- =====================================================
-- 第二步：创建小红书帖子缓存表 (xhs_posts_cache)
-- =====================================================
CREATE TABLE IF NOT EXISTS xhs_posts_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT UNIQUE NOT NULL,             -- 小红书帖子ID
  post_url TEXT UNIQUE NOT NULL,           -- 帖子链接
  title TEXT DEFAULT '',                   -- 帖子标题
  description TEXT DEFAULT '',             -- 帖子描述
  author_user_id TEXT NOT NULL,           -- 作者用户ID
  author_nickname TEXT NOT NULL,          -- 作者昵称
  author_avatar TEXT,                     -- 作者头像
  likes_count INTEGER DEFAULT 0,         -- 点赞数
  comments_count INTEGER DEFAULT 0,      -- 评论数
  shares_count INTEGER DEFAULT 0,        -- 分享数
  collections_count INTEGER DEFAULT 0,   -- 收藏数
  publish_time TIMESTAMP WITH TIME ZONE, -- 发布时间
  images JSONB DEFAULT '[]',             -- 图片URLs数组
  last_stats_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 外键关联到用户缓存表
  FOREIGN KEY (author_user_id) REFERENCES xhs_users_cache(user_id) ON DELETE CASCADE,

  -- 约束检查
  CONSTRAINT check_post_id_format CHECK (post_id ~ '^[a-zA-Z0-9]+$'),
  CONSTRAINT check_stats_non_negative CHECK (
    likes_count >= 0 AND
    comments_count >= 0 AND
    shares_count >= 0 AND
    collections_count >= 0
  )
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_xhs_posts_cache_post_id ON xhs_posts_cache(post_id);
CREATE INDEX IF NOT EXISTS idx_xhs_posts_cache_url ON xhs_posts_cache(post_url);
CREATE INDEX IF NOT EXISTS idx_xhs_posts_cache_author ON xhs_posts_cache(author_user_id);
CREATE INDEX IF NOT EXISTS idx_xhs_posts_cache_likes ON xhs_posts_cache(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_xhs_posts_cache_publish_time ON xhs_posts_cache(publish_time DESC);
CREATE INDEX IF NOT EXISTS idx_xhs_posts_cache_stats_update ON xhs_posts_cache(last_stats_update);

-- =====================================================
-- 第三步：创建热门帖子汇总表 (xhs_trending_posts)
-- =====================================================
CREATE TABLE IF NOT EXISTS xhs_trending_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES xhs_posts_cache(post_id) ON DELETE CASCADE,
  category TEXT NOT NULL,                    -- 分类：student_profile, checkin_data, keyword_search
  keywords TEXT,                            -- 关键词（用于搜索类型）
  student_id TEXT,                         -- 学员ID（用于学员相关类型）
  ranking_score DECIMAL(10,2) DEFAULT 0,   -- 排名得分
  ranking_position INTEGER,                -- 排名位置
  calculation_date DATE NOT NULL,          -- 计算日期
  is_active BOOLEAN DEFAULT TRUE,          -- 是否在榜单中显示
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 复合唯一约束：同一天同一分类同一帖子只能有一条记录
  UNIQUE(post_id, category, calculation_date),

  -- 外键约束
  FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_xhs_trending_posts_category ON xhs_trending_posts(category);
CREATE INDEX IF NOT EXISTS idx_xhs_trending_posts_date ON xhs_trending_posts(calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_xhs_trending_posts_ranking ON xhs_trending_posts(ranking_position ASC);
CREATE INDEX IF NOT EXISTS idx_xhs_trending_posts_student ON xhs_trending_posts(student_id);
CREATE INDEX IF NOT EXISTS idx_xhs_trending_posts_active ON xhs_trending_posts(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 第四步：创建搜索缓存表 (xhs_search_cache)
-- =====================================================
CREATE TABLE IF NOT EXISTS xhs_search_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keywords TEXT NOT NULL,                  -- 搜索关键词
  keywords_hash TEXT UNIQUE NOT NULL,     -- 关键词哈希值
  search_type TEXT DEFAULT 'general',     -- 搜索类型
  results_data JSONB NOT NULL,           -- 搜索结果JSON
  result_count INTEGER DEFAULT 0,        -- 结果数量
  search_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),

  CONSTRAINT check_keywords_not_empty CHECK (LENGTH(TRIM(keywords)) > 0)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_xhs_search_cache_keywords ON xhs_search_cache(keywords_hash);
CREATE INDEX IF NOT EXISTS idx_xhs_search_cache_type ON xhs_search_cache(search_type);
CREATE INDEX IF NOT EXISTS idx_xhs_search_cache_expires ON xhs_search_cache(expires_at);

-- =====================================================
-- 第五步：创建数据抓取日志表 (xhs_crawl_logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS xhs_crawl_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL,            -- 操作类型：search, profile, post_details
  target_url TEXT,                        -- 目标URL
  request_data JSONB,                     -- 请求数据
  response_status INTEGER,                -- 响应状态码
  response_data JSONB,                   -- 响应数据
  success BOOLEAN NOT NULL,              -- 是否成功
  error_message TEXT,                    -- 错误信息
  execution_time INTEGER,               -- 执行时间（毫秒）
  rate_limit_applied BOOLEAN DEFAULT FALSE, -- 是否应用了频率限制
  risk_detected BOOLEAN DEFAULT FALSE,   -- 是否检测到风险
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_xhs_crawl_logs_operation ON xhs_crawl_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_xhs_crawl_logs_success ON xhs_crawl_logs(success);
CREATE INDEX IF NOT EXISTS idx_xhs_crawl_logs_created ON xhs_crawl_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xhs_crawl_logs_risk ON xhs_crawl_logs(risk_detected) WHERE risk_detected = TRUE;

-- =====================================================
-- 第六步：创建触发器函数（自动更新时间戳）
-- =====================================================
CREATE OR REPLACE FUNCTION update_xhs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户缓存表创建更新触发器
DROP TRIGGER IF EXISTS update_xhs_users_cache_timestamp ON xhs_users_cache;
CREATE TRIGGER update_xhs_users_cache_timestamp
    BEFORE UPDATE ON xhs_users_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_xhs_timestamp();

-- 为帖子缓存表创建更新触发器
CREATE OR REPLACE FUNCTION update_xhs_posts_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_stats_update = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_xhs_posts_cache_stats ON xhs_posts_cache;
CREATE TRIGGER update_xhs_posts_cache_stats
    BEFORE UPDATE ON xhs_posts_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_xhs_posts_stats_timestamp();

-- =====================================================
-- 第七步：创建清理过期数据的存储过程
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_xhs_cache()
RETURNS void AS $$
BEGIN
    -- 清理过期搜索缓存（超过24小时）
    DELETE FROM xhs_search_cache
    WHERE expires_at < NOW();

    -- 清理旧的抓取日志（保留30天）
    DELETE FROM xhs_crawl_logs
    WHERE created_at < NOW() - INTERVAL '30 days';

    -- 清理不活跃的用户缓存（超过7天未更新）
    DELETE FROM xhs_users_cache
    WHERE last_updated_at < NOW() - INTERVAL '7 days'
    AND is_active = FALSE;

    -- 记录清理操作
    RAISE NOTICE '小红书缓存清理完成：清理时间 %', NOW();
END;
$$ language 'plpgsql';

-- =====================================================
-- 第八步：创建RLS (Row Level Security) 策略
-- =====================================================

-- 启用RLS
ALTER TABLE xhs_users_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE xhs_posts_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE xhs_trending_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE xhs_search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE xhs_crawl_logs ENABLE ROW LEVEL SECURITY;

-- 允许应用程序完全访问这些表（因为这些是缓存数据，不涉及用户隐私）
CREATE POLICY "Allow full access to xhs_users_cache" ON xhs_users_cache FOR ALL USING (true);
CREATE POLICY "Allow full access to xhs_posts_cache" ON xhs_posts_cache FOR ALL USING (true);
CREATE POLICY "Allow full access to xhs_trending_posts" ON xhs_trending_posts FOR ALL USING (true);
CREATE POLICY "Allow full access to xhs_search_cache" ON xhs_search_cache FOR ALL USING (true);

-- 抓取日志仅允许插入和查询
CREATE POLICY "Allow insert and select on xhs_crawl_logs" ON xhs_crawl_logs
FOR SELECT USING (true);
CREATE POLICY "Allow insert on xhs_crawl_logs" ON xhs_crawl_logs
FOR INSERT WITH CHECK (true);

-- =====================================================
-- 第九步：添加表注释
-- =====================================================
COMMENT ON TABLE xhs_users_cache IS '小红书用户信息缓存表，减少重复抓取用户数据';
COMMENT ON TABLE xhs_posts_cache IS '小红书帖子内容缓存表，存储帖子详情和互动数据';
COMMENT ON TABLE xhs_trending_posts IS '热门帖子汇总表，用于生成各类排行榜';
COMMENT ON TABLE xhs_search_cache IS '搜索结果缓存表，避免重复搜索相同关键词';
COMMENT ON TABLE xhs_crawl_logs IS '数据抓取日志表，记录所有抓取操作的详细信息';

-- 列注释
COMMENT ON COLUMN xhs_users_cache.user_id IS '小红书用户唯一标识';
COMMENT ON COLUMN xhs_posts_cache.post_id IS '小红书帖子唯一标识';
COMMENT ON COLUMN xhs_trending_posts.ranking_score IS '排名算法计算的综合得分';
COMMENT ON COLUMN xhs_search_cache.keywords_hash IS '关键词MD5哈希，用于快速查找缓存';

-- =====================================================
-- 第十步：创建视图方便查询
-- =====================================================

-- 学员优秀帖子视图
CREATE OR REPLACE VIEW v_student_trending_posts AS
SELECT
    tp.ranking_position,
    tp.ranking_score,
    u.student_id,
    u.name as student_name,
    u.xiaohongshu_profile_url,
    p.post_url,
    p.title,
    p.likes_count,
    p.comments_count,
    p.collections_count,
    p.publish_time,
    tp.calculation_date
FROM xhs_trending_posts tp
JOIN xhs_posts_cache p ON tp.post_id = p.post_id
JOIN users u ON tp.student_id = u.student_id
WHERE tp.category = 'student_profile'
  AND tp.is_active = TRUE
ORDER BY tp.calculation_date DESC, tp.ranking_position ASC;

-- 打卡优秀帖子视图
CREATE OR REPLACE VIEW v_checkin_trending_posts AS
SELECT
    tp.ranking_position,
    tp.ranking_score,
    u.student_id,
    u.name as student_name,
    p.post_url,
    p.title,
    p.likes_count,
    p.comments_count,
    p.collections_count,
    p.publish_time,
    tp.calculation_date
FROM xhs_trending_posts tp
JOIN xhs_posts_cache p ON tp.post_id = p.post_id
JOIN users u ON tp.student_id = u.student_id
WHERE tp.category = 'checkin_data'
  AND tp.is_active = TRUE
ORDER BY tp.calculation_date DESC, tp.ranking_position ASC;

COMMENT ON VIEW v_student_trending_posts IS '学员主页优秀帖子排行榜视图';
COMMENT ON VIEW v_checkin_trending_posts IS '学员打卡优秀帖子排行榜视图';

-- 执行完成提示
SELECT
    '小红书集成数据表创建完成' as message,
    NOW() as completed_at;