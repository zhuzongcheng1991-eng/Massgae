# 后端服务设置

## 功能
- 大众点评 API 订单同步
- 定时自动同步（每 30 分钟）
- 手动同步功能
- REST API 供前端调用

## 安装

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 启动服务

```bash
npm start
```

开发模式（自动重启）:
```bash
npm run dev
```

### 3. 配置大众点评 API

1. 打开设置页面
2. 填写大众点评 App Key 和 Secret
3. 点击"测试连接"验证
4. 保存配置

## API 端点

- `GET /api/health` - 健康检查
- `GET /api/config` - 获取配置
- `POST /api/config` - 更新配置
- `GET /api/orders` - 获取订单
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id` - 更新订单
- `DELETE /api/orders/:id` - 删除订单
- `POST /api/sync/dianping` - 手动同步大众点评订单

## 大众点评 API 申请

1. 访问 https://open.dianping.com/
2. 注册开发者账号
3. 创建应用获取 appkey 和 secret
4. 申请订单相关 API 权限（需要商家资质）

## 注意事项

- 后端服务默认运行在 http://localhost:3000
- 前端需要能访问后端服务才能使用 API 同步功能
- 数据存储在 `backend/data.json` 文件中
