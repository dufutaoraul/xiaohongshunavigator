-- 创建小红书导航器相关数据表

-- 1. 打卡记录表
CREATE TABLE IF NOT EXISTS xhs_checkins (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    links TEXT[] NOT NULL DEFAULT '{}',
    passed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT unique_student_date UNIQUE(student_id, date),
    CONSTRAINT valid_student_id CHECK (student_id != ''),
    CONSTRAINT valid_links CHECK (array_length(links, 1) >= 0)
);

-- 2. 搜索日志表
CREATE TABLE IF NOT EXISTS xhs_search_logs (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    sort_type VARCHAR(20) NOT NULL DEFAULT 'general',
    top_note_ids TEXT[] DEFAULT '{}',
    result_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT valid_sort_type CHECK (sort_type IN ('general', 'time', 'like')),
    CONSTRAINT valid_keywords CHECK (array_length(keywords, 1) > 0)
);

-- 3. 笔记缓存表
CREATE TABLE IF NOT EXISTS xhs_notes_cache (
    note_id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    cover_url TEXT DEFAULT '',
    author_id TEXT DEFAULT '',
    author_name TEXT DEFAULT '',
    liked_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    url TEXT DEFAULT '',
    published_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT valid_note_id CHECK (note_id != ''),
    CONSTRAINT valid_counts CHECK (liked_count >= 0 AND comment_count >= 0)
);

-- 4. 小红书提醒表
CREATE TABLE IF NOT EXISTS xhs_alerts (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    note_id TEXT NOT NULL,
    liked_count INTEGER NOT NULL DEFAULT 0,
    alert_type VARCHAR(20) NOT NULL DEFAULT 'like_milestone',
    handled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    handled_at TIMESTAMPTZ,
    
    -- 约束
    CONSTRAINT valid_alert_type CHECK (alert_type IN ('like_milestone', 'comment_milestone', 'viral')),
    CONSTRAINT fk_note_id FOREIGN KEY (note_id) REFERENCES xhs_notes_cache(note_id) ON DELETE CASCADE
);

-- 5. 退款申请表
CREATE TABLE IF NOT EXISTS xhs_refund_requests (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    window_start DATE NOT NULL,
    window_end DATE NOT NULL,
    passed_days INTEGER NOT NULL DEFAULT 0,
    eligible BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewer_id VARCHAR(50),
    notes TEXT,
    
    -- 约束
    CONSTRAINT valid_window CHECK (window_end >= window_start),
    CONSTRAINT valid_passed_days CHECK (passed_days >= 0 AND passed_days <= 93),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    CONSTRAINT unique_student_window UNIQUE(student_id, window_start, window_end)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_checkins_student_id ON xhs_checkins(student_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON xhs_checkins(date);
CREATE INDEX IF NOT EXISTS idx_checkins_passed ON xhs_checkins(passed);

CREATE INDEX IF NOT EXISTS idx_search_logs_student_id ON xhs_search_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON xhs_search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_keywords ON xhs_search_logs USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_notes_cache_liked_count ON xhs_notes_cache(liked_count);
CREATE INDEX IF NOT EXISTS idx_notes_cache_last_seen ON xhs_notes_cache(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_notes_cache_author ON xhs_notes_cache(author_id);

CREATE INDEX IF NOT EXISTS idx_alerts_student_id ON xhs_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_handled ON xhs_alerts(handled);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON xhs_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_refund_student_id ON xhs_refund_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_refund_status ON xhs_refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requested_at ON xhs_refund_requests(requested_at);

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_checkins_updated_at
    BEFORE UPDATE ON xhs_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE xhs_checkins IS '学员打卡记录表';
COMMENT ON TABLE xhs_search_logs IS '搜索日志表，记录学员的搜索行为';
COMMENT ON TABLE xhs_notes_cache IS '笔记缓存表，存储小红书笔记的基本信息';
COMMENT ON TABLE xhs_alerts IS '小红书提醒表，记录需要通知管理员的事件';
COMMENT ON TABLE xhs_refund_requests IS '退款申请表，记录学员的退款资格和申请';
