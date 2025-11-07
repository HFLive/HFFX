# 华南师大附中返校团队网站

返校活动筹备组官方网站，包含动态主页和问卷调查功能。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **动效**: Framer Motion + Lenis
- **部署**: 适用于国内云服务器（腾讯云/阿里云香港）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
hffx-site/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── survey/            # 问卷页
│   └── globals.css        # 全局样式
├── components/             # React 组件
│   ├── sections/          # 首页各区块组件
│   ├── survey/            # 问卷相关组件
│   └── providers/         # Context 提供者
├── data/                  # 数据文件（JSON/Markdown）
│   ├── team.json          # 团队成员数据
│   ├── products.json      # 文创产品数据
│   ├── timeline.json      # 时间线数据
│   └── survey.json        # 问卷配置
├── lib/                   # 工具函数
└── public/                # 静态资源
```

## 配置说明

### 修改内容数据

所有可编辑的内容都在 `data/` 目录下的 JSON 文件中：

- **团队信息**: 编辑 `data/team.json`
- **文创产品**: 编辑 `data/products.json`
- **时间线**: 编辑 `data/timeline.json`
- **问卷链接**: 编辑 `data/survey.json` 中的 `url` 字段

### 修改主题颜色

编辑 `tailwind.config.ts` 中的颜色配置：

```typescript
colors: {
  primary: "#29957F",      // 校徽色
  secondary: "#1e3a8a",   // 校服深蓝色
  // ...
}
```

### 修改返校日期

编辑 `components/sections/Countdown.tsx`：

```typescript
const TARGET_DATE = new Date("2025-12-31T23:59:59").getTime();
```

## 部署到服务器

### 1. 服务器环境要求

- Node.js 18 LTS 或更高版本
- Nginx（用于反向代理）
- PM2（用于进程管理，可选）

### 2. 部署步骤

#### 方法一：使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 构建项目
npm run build

# 启动应用
pm2 start npm --name "hffx-site" -- start

# 设置开机自启
pm2 startup
pm2 save
```

#### 方法二：直接运行

```bash
npm run build
npm start
```

### 3. Nginx 配置

创建 `/etc/nginx/sites-available/hffx-site`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 或服务器IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/hffx-site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. HTTPS 配置（后续可添加）

使用 Let's Encrypt 或云服务商提供的免费证书：

```bash
# 安装 Certbot（Ubuntu/Debian）
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com
```

修改 Nginx 配置监听 443 端口并配置 SSL 证书路径。

## 更新内容

更新网站内容只需要：

1. 修改 `data/` 目录下的 JSON 文件
2. 重新构建：`npm run build`
3. 重启服务：`pm2 restart hffx-site` 或 `npm start`

## 注意事项

- 问卷链接需要在 `data/survey.json` 中配置真实链接
- Logo 占位符在 `components/sections/Hero.tsx` 中，后续替换为真实 Logo
- 所有动效都支持 `prefers-reduced-motion`，会为有需求的用户自动简化
- 网站已针对移动端优化，响应式设计

## 许可证

内部使用

