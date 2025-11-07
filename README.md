# 华南师大附中返校团队网站
## 技术栈
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **动效**: Framer Motion + Lenis
- **部署**: 适用于国内云服务器（腾讯云/阿里云香港）

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
  primary: "#29957F",
  secondary: "#1e3a8a",
  // ...
}
```

### 修改返校日期
编辑 `components/sections/Countdown.tsx`：
```typescript
const TARGET_DATE = new Date("2025-12-31T23:59:59").getTime();
```

## 许可证
内部使用

