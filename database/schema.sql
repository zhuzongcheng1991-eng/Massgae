-- ============================================================
-- 乐轻松 Happy Spa - Supabase 完整数据库 Schema
-- 在 Supabase Dashboard → SQL Editor 中运行此脚本
-- ============================================================

-- 1. 订单表 (按日聚合)
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 配置表 (通用 key-value 存储)
CREATE TABLE IF NOT EXISTS config (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);
CREATE INDEX IF NOT EXISTS idx_orders_data_gin ON orders USING gin(data);

-- 自动更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_config_updated_at ON config;
CREATE TRIGGER trg_config_updated_at
    BEFORE UPDATE ON config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 启用实时同步
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE config;

-- 行级安全策略 - 允许公开读写 (使用 publishable key)
DROP POLICY IF EXISTS "allow_read_orders" ON orders;
DROP POLICY IF EXISTS "allow_write_orders" ON orders;
DROP POLICY IF EXISTS "allow_read_config" ON config;
DROP POLICY IF EXISTS "allow_write_config" ON config;

CREATE POLICY "allow_read_orders" ON orders FOR SELECT USING (true);
CREATE POLICY "allow_write_orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_read_config" ON config FOR SELECT USING (true);
CREATE POLICY "allow_write_config" ON config FOR ALL USING (true) WITH CHECK (true);
