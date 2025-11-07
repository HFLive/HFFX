# 快速启动指南

## 首次运行

### 1. 进入项目目录

```bash
cd hffx-site
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器访问：http://localhost:3000

## 配置修改

### 修改团队信息

编辑 `data/team.json`，修改成员姓名和角色。

### 修改文创产品

编辑 `data/products.json`，添加或修改产品信息。

### 修改时间线

编辑 `data/timeline.json`，更新事件信息。

### 修改问卷链接

编辑 `data/survey.json`，将 `url` 替换为真实的腾讯问卷链接。

### 修改返校日期

编辑 `components/sections/Countdown.tsx`：

```typescript
const TARGET_DATE = new Date("2025-12-31T23:59:59").getTime();
```

### 替换 Logo

1. 将 Logo 图片放入 `public/` 目录
2. 编辑 `components/sections/Hero.tsx`，将占位符替换为真实 Logo：

```tsx
<Image src="/logo.png" alt="Logo" width={128} height={128} />
```

## 构建生产版本

```bash
npm run build
npm start
```

## 部署到服务器

参考 `README.md` 中的部署说明，使用 PM2 和 Nginx 进行部署。

