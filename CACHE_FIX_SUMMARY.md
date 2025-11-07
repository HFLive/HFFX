# Next.js 缓存问题修复总结

## 问题描述
后台修改数据后，数据库更新成功，但前端页面刷新后显示旧数据，需要重启服务才能看到更新。

## 根本原因
Next.js 14 的多层缓存机制：
1. **页面缓存** - 静态页面在构建时预渲染
2. **API 路由缓存** - GET 请求默认缓存
3. **数据缓存** - fetch 和数据库查询结果缓存

## 解决方案

### 1. 数据层禁用缓存（lib 文件）
在所有数据获取函数中添加 `noStore()` 调用：

**修改的文件：**
- ✅ `lib/timeline.ts` - `readTimeline()` 和 `writeTimeline()`
- ✅ `lib/survey.ts` - `readSurveys()` 和 `readSurveyBySlug()`
- ✅ `lib/danmaku.ts` - `readDanmaku()`
- ✅ `lib/countdown.ts` - `readCountdown()` 和 `writeCountdown()`

**示例代码：**
```typescript
import { unstable_noStore as noStore } from 'next/cache';

export async function readTimeline() {
  noStore(); // 禁用数据缓存
  const data = await prisma.timelineEvent.findMany();
  return data;
}
```

### 2. 前端页面禁用缓存
在所有需要动态数据的页面添加配置：

**修改的文件：**
- ✅ `app/page.tsx` - 首页
- ✅ `app/timeline/page.tsx` - 时间线页面
- ✅ `app/survey/page.tsx` - 问卷列表页面
- ✅ `app/survey/[slug]/page.tsx` - 问卷详情页面
- ✅ `app/products/page.tsx` - 商品页面
- ✅ `app/team/page.tsx` - 团队页面

**示例代码：**
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  // 页面内容
}
```

### 3. API 路由禁用缓存
在所有 API 路由添加配置：

**修改的文件：**

**公开 API：**
- ✅ `app/api/timeline/route.ts`
- ✅ `app/api/danmaku/route.ts`
- ✅ `app/api/surveys/route.ts`
- ✅ `app/api/countdown/route.ts`

**后台 API：**
- ✅ `app/api/admin/timeline/route.ts`
- ✅ `app/api/admin/timeline/[eventId]/route.ts`
- ✅ `app/api/admin/surveys/route.ts`
- ✅ `app/api/admin/surveys/[slug]/route.ts`
- ✅ `app/api/admin/danmaku/route.ts`
- ✅ `app/api/admin/danmaku/[id]/route.ts`
- ✅ `app/api/admin/settings/countdown/route.ts`

**示例代码：**
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // API 逻辑
}
```

## 部署步骤

在服务器上执行以下命令：

```bash
cd /www/wwwroot/hsfzfx

# 1. 拉取最新代码
git pull

# 2. 删除旧的构建缓存
rm -rf .next

# 3. 重新构建
npm run build

# 4. 重启服务
pm2 restart hsfzfx

# 5. 验证
pm2 logs hsfzfx --lines 50
```

## 验证方法

1. 登录后台修改数据（如添加弹幕、更新时间线）
2. 打开前端页面（不需要重启服务）
3. 刷新页面，应该能立即看到更新后的数据

## 预期效果

- ✅ 后台修改数据后，数据库立即更新
- ✅ 前端刷新页面立即显示最新数据
- ✅ 无需重启 PM2 服务
- ✅ 所有路由显示为动态路由（`ƒ Dynamic`）

## 技术细节

### 为什么需要三层禁用？

1. **noStore()** - 确保数据库查询不被缓存
2. **dynamic = 'force-dynamic'** - 确保页面/API 路由在每次请求时重新渲染
3. **revalidate = 0** - 禁用增量静态再生（ISR）缓存

### Next.js 14 缓存机制

Next.js 14 默认缓存策略：
- 页面在构建时预渲染（Static）
- GET API 路由默认缓存 
- 数据库查询结果缓存

这对于内容不常变化的网站很好，但对于需要实时更新的后台管理系统，需要显式禁用缓存。

## 注意事项

- 禁用缓存会略微降低性能，但对于后台管理系统来说，数据实时性更重要
- 所有修改都在本地完成并通过构建测试
- 使用 `git pull` 一次性更新所有文件，避免在服务器上逐个修改

## 相关文档

- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Dynamic Functions](https://nextjs.org/docs/app/api-reference/functions/unstable_noStore)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)

