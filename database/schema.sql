-- ============================================================
-- 乐轻松 Happy Spa - Supabase 数据库完整 Schema
-- 在 Supabase Dashboard → SQL Editor 中运行
-- ============================================================

-- 1. 订单表 (按日聚合)
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 配置表 (系统设置、轮班状态等)
CREATE TABLE IF NOT EXISTS config (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 索引
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);
CREATE INDEX IF NOT EXISTS idx_orders_data_gin ON orders USING gin(data);

-- 4. 自动更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_config_updated_at
    BEFORE UPDATE ON config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. 启用实时同步 (RLS 关闭 - 公开读写)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE config;

-- 6. 行级安全策略 - 允许公开读写 (使用 publishable key)
DROP POLICY IF EXISTS "允许所有人读取订单" ON orders;
DROP POLICY IF EXISTS "允许所有人写入订单" ON orders;
DROP POLICY IF EXISTS "允许所有人读取配置" ON config;
DROP POLICY IF EXISTS "允许所有人写入配置" ON config;

CREATE POLICY "allow_read_orders" ON orders FOR SELECT USING (true);
CREATE POLICY "allow_write_orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_read_config" ON config FOR SELECT USING (true);
CREATE POLICY "allow_write_config" ON config FOR ALL USING (true) WITH CHECK (true);
