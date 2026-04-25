# 部署指南 - 乐轻松 Happy Spa 订单管理系统

## 架构

```
┌─────────────────────────────────────────────────┐
│                  用户浏览器                        │
│              https://xxx.vercel.app              │
└──────────────────┬──────────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
  ┌──────────────┐  ┌──────────────────┐
  │  index.html  │  │  Serverless API  │
  │  静态页面     │  │  /api/*          │
  │  (前端 UI)   │  │  (Express 函数)  │
  └──────┬───────┘  └────────┬─────────┘
         │                   │
         │     ┌─────────────┘
         │     │
         ▼     ▼
  ┌──────────────────┐
  │   Supabase       │
  │   PostgreSQL     │
  │   - orders 表    │
  │   - config 表    │
  └──────────────────┘
```

## 部署步骤

### 第一步：Supabase 数据库设置

1. 登录 https://supabase.com
2. 进入项目 `vgyklddspgvtbwvegsob`
3. 打开 **SQL Editor**
4. 复制粘贴 `database/schema.sql` 全部内容，执行

### 第二步：Vercel 部署

#### 注册/登录 Vercel
1. 访问 https://vercel.com
2. 用 GitHub 账号登录

#### 方式 A：GitHub 自动部署（推荐）

```bash
# 1. 在项目目录初始化 Git（已初始化则跳过）
cd /Users/bis/Desktop/playground/massage-shop-system
git add .
git commit -m "准备部署"

# 2. 创建 GitHub 仓库（如果没有）
# 在 github.com 创建新仓库后：
git remote add origin https://github.com/你的用户名/massage-shop-system.git
git push -u origin main

# 3. 在 Vercel 中导入项目
#    - 点击 "New Project"
#    - 导入 GitHub 仓库
#    - 无需配置，自动识别
#    - 点击 "Deploy"
```

#### 方式 B：Vercel CLI 直接部署

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 进入项目目录
cd /Users/bis/Desktop/playground/massage-shop-system

# 4. 部署（测试）
vercel --builds

# 5. 部署到生产环境
vercel deploy --prod --builds
```

### 第三步：配置环境变量

在 Vercel 项目设置中添加环境变量（Settings → Environment Variables）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SUPABASE_URL` | `https://vgyklddspgvtbwvegsob.supabase.co` | Supabase 项目地址 |
| `SUPABASE_KEY` | `sb_publishable_n9gfFPMn...` | Supabase publishable key |
| `API_SECRET` | 随机字符串 | API 密钥（可选） |
| `DP_APPKEY` | 你的大众点评 appkey | 大众点评 API（可选） |
| `DP_SECRET` | 你的大众点评 secret | 大众点评 API（可选） |

### 第四步：验证部署

部署完成后，访问 Vercel 分配的域名：

```
https://你的项目名.vercel.app
```

打开浏览器控制台，检查：
- 页面正常加载
- 云同步状态显示「云同步」
- 新建订单后，Supabase 中能看到数据

## API 端点

部署后可通过以下方式调用 API：

```bash
# 健康检查
curl https://xxx.vercel.app/api/health

# 获取订单
curl "https://xxx.vercel.app/api/orders?date=2026-04-03"

# 获取配置
curl "https://xxx.vercel.app/api/config?key=dianping"

# 同步大众点评订单
curl -X POST https://xxx.vercel.app/api/sync/dianping \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-04-03"}'
```

## 自定义域名（可选）

在 Vercel → Settings → Domains 中添加你的域名，按提示配置 DNS。

## 本地开发

```bash
# 安装 Vercel CLI
npm i -g vercel

# 本地模拟生产环境
vercel dev --builds
```

或单独启动原后端（用于大众点评同步）：

```bash
cd backend
npm install
npm start
```

## 费用

| 服务 | 方案 | 费用 |
|------|------|------|
| Vercel | Hobby | 免费（个人项目） |
| Supabase | Free | 500MB 数据库免费 |
| 自定义域名 | 无 | 可选 |

**总费用：$0/月**
