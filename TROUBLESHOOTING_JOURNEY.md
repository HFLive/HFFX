# 缓存问题排查与修复全过程

> 记录日期：2024-11-08  
> 问题：后台修改数据后前端不同步更新  
> 状态：✅ 已解决

---

## 📋 目录

- [问题现象](#问题现象)
- [排查过程](#排查过程)
- [最终修改](#最终修改)
- [缓存层级](#缓存层级)
- [核心教训](#核心教训)
- [最终效果](#最终效果)

---

## 问题现象

### 用户报告的问题
1. 在本地开发环境（`npm run dev`）使用 `/admin` 后台可以正常编辑网站数据
2. 部署到生产环境后，后台的编辑无效
3. 数据库中的数据已更新，但前端页面刷新后仍显示旧数据
4. 需要重启 PM2 服务才能看到更新（有时重启也不行）

### 关键现象（后期发现）
- ✅ 全新设备第一次访问：显示正确的新数据
- ❌ 刷新页面后：又变回旧数据
- ✅ 服务器端 API 返回：正确的新数据
- ❌ 浏览器页面显示：错误的旧数据

**这个现象成为解决问题的关键线索！**

---

## 排查过程

### 第一阶段：初期假设 - 文件权限问题

#### 假设
最初使用 JSON 文件存储数据，怀疑是生产环境文件写入权限问题。

#### 验证
```bash
# 检查文件权限
ls -la data/
# 发现权限正常

# 检查 PM2 运行用户
ps aux | grep PM2
# 运行在 root 用户下
```

#### 结论
❌ 不是权限问题，但为了更好的稳定性，决定迁移到数据库。

---

### 第二阶段：数据迁移 - JSON → SQLite + Prisma

#### 操作
1. 创建 Prisma Schema：
   - `Survey` 模型（问卷）
   - `TimelineEvent` 模型（时间线事件）
   - `Danmaku` 模型（弹幕）
   - `SiteSetting` 模型（网站设置）

2. 修改数据访问层：
   - `lib/survey.ts`
   - `lib/timeline.ts`
   - `lib/danmaku.ts`
   - `lib/countdown.ts`

3. 执行数据库迁移：
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

#### 结果
✅ 数据成功保存到数据库  
❌ 但缓存问题依然存在

---

### 第三阶段：Next.js 服务器端缓存

#### 问题分析
Next.js 14 有多层缓存机制：
1. 页面缓存 - 静态页面预渲染
2. API 路由缓存 - GET 请求默认缓存
3. 数据缓存 - fetch 和数据库查询缓存

#### 解决方案 1：禁用页面缓存
在所有动态页面添加：
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**修改的文件：**
- `app/page.tsx`
- `app/timeline/page.tsx`
- `app/survey/page.tsx`
- `app/survey/[slug]/page.tsx`
- `app/products/page.tsx`
- `app/team/page.tsx`

#### 解决方案 2：禁用 API 路由缓存
在所有 API 路由添加：
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**修改的文件：**（共11个）
- 公开 API：`app/api/timeline/route.ts`、`app/api/danmaku/route.ts` 等
- 后台 API：`app/api/admin/timeline/route.ts`、`app/api/admin/surveys/route.ts` 等

#### 解决方案 3：禁用数据缓存
在所有数据获取函数中添加 `noStore()`：
```typescript
import { unstable_noStore as noStore } from 'next/cache';

export async function readTimeline() {
  noStore(); // 禁用数据缓存
  const data = await prisma.timelineEvent.findMany();
  return data;
}
```

**修改的文件：**
- `lib/timeline.ts`
- `lib/survey.ts`
- `lib/danmaku.ts`
- `lib/countdown.ts`

#### 构建验证
```bash
npm run build
```

查看构建输出，确认所有路由都标记为 `ƒ` (Dynamic)：
```
Route (app)                                   Size     First Load JS
┌ ƒ /timeline                                 1.92 kB         128 kB
└ ƒ /survey                                   951 B           136 kB
```

#### 结果
✅ 服务器端缓存已禁用  
✅ API 返回正确数据  
❌ 但浏览器刷新后仍显示旧数据（时好时坏）

---

### 第四阶段：关键突破 - 浏览器缓存

#### 关键测试
用户使用**全新设备**（从未访问过网站）进行测试：
1. 第一次访问 → ✅ 显示 "new value"（正确）
2. 刷新页面 → ❌ 显示 "各时间会依据实际情况调整...333333"（旧数据）

**这个测试结果至关重要！**

#### 分析过程
```bash
# 1. 检查数据库
sqlite3 prisma/prisma/dev.db "SELECT value FROM SiteSetting WHERE key='timeline_note';"
# 输出：new value ✅

# 2. 检查 API
curl -s http://localhost:3000/api/timeline
# 输出：{"note":"new value","events":[]} ✅

# 3. 检查服务器返回的 HTML
curl -s http://localhost:3000/timeline | grep -i "new value"
# 输出：<p>new value</p> ✅

# 4. 但浏览器显示
# 显示：各时间会依据实际情况调整...333333 ❌
```

#### 结论
- ✅ 数据库：正确
- ✅ API：正确
- ✅ 服务器端渲染的 HTML：正确
- ❌ 浏览器显示：错误

**问题根源：浏览器缓存了 HTML 页面！**

---

### 第五阶段：HTTP 响应头配置

#### 问题
虽然 Next.js 层面配置了 `dynamic = 'force-dynamic'`，但没有明确告诉浏览器不要缓存。

#### 解决方案：修改 next.config.js
添加 `Cache-Control` HTTP 响应头：

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      // 安全头
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      // 禁用动态页面的浏览器缓存
      {
        source: '/timeline',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/survey/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/products',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/team',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
};
```

#### 验证
```bash
# 本地构建测试
npm run build
# ✅ 构建成功

# 部署到服务器
git push
cd /www/wwwroot/hsfzfx
git pull
rm -rf .next
npm run build
pm2 restart hffx-site
```

#### 结果
✅ Next.js 层面的 Cache-Control 已配置  
❌ 但仍然有问题（状态码 304，浏览器使用协商缓存）

---

### 第六阶段：最终问题 - Nginx 缓存

#### 发现问题
检查 HTTPS 请求的响应头：

```http
GET https://2025fx.hsfz.live/timeline

Status: 304 Not Modified

Response Headers:
cache-control: s-maxage=31536000, stale-while-revalidate  ← ❌ Nginx 添加的！
cache-control: no-cache                                    ← ✅ Next.js 的
x-nextjs-cache: HIT                                       ← ❌ 缓存命中
etag: "160d30m8lsr9w8"                                    ← ❌ ETag 协商缓存
```

**问题分析：**
1. Nginx 添加了 `s-maxage=31536000`（1年缓存）
2. 这个头覆盖了 Next.js 的 `no-cache`
3. 浏览器使用 ETag 进行协商缓存（304 Not Modified）

#### 原始 Nginx 配置（有问题）
```nginx
location ^~ / {
    proxy_pass http://127.0.0.1:3000;
    
    # 问题：这个配置不够强
    set $static_file 0;
    if ( $uri ~* "\.(gif|png|jpg|css|js|woff|woff2)$" ) {
        set $static_file 1;
        expires 1m;
    }
    if ( $static_file = 0 ) {
        add_header Cache-Control no-cache;  # ← 太弱了！
    }
}
```

#### 修改后的 Nginx 配置（正确）
```nginx
location ^~ / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host 2025fx.hsfz.live;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header REMOTE-HOST $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_http_version 1.1;
    
    # 禁用 Nginx 代理缓存
    proxy_cache off;
    proxy_no_cache 1;
    proxy_cache_bypass 1;
    
    # 对于静态资源（图片、CSS、JS、字体）允许缓存
    set $static_file 0;
    if ( $uri ~* "\.(gif|png|jpg|jpeg|ico|css|js|woff|woff2|ttf|svg)$" ) {
        set $static_file 1;
    }
    
    if ( $static_file = 1 ) {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # 对于动态页面和 API，强制不缓存
    if ( $static_file = 0 ) {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        expires off;
    }
    
    add_header X-Cache $upstream_cache_status;
}
```

#### 验证
```bash
# 1. 测试 Nginx 配置
nginx -t

# 2. 重载 Nginx
nginx -s reload

# 3. 验证响应头
curl -I https://2025fx.hsfz.live/timeline | grep -i cache
```

输出：
```
cache-control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
pragma: no-cache
```

✅ **完美！Cache-Control 响应头正确！**

---

## 最终修改

### 文件修改汇总

#### 1. 数据层（4个文件）
| 文件 | 修改内容 |
|------|---------|
| `lib/timeline.ts` | 添加 `noStore()` |
| `lib/survey.ts` | 添加 `noStore()` |
| `lib/danmaku.ts` | 添加 `noStore()` |
| `lib/countdown.ts` | 添加 `noStore()` |

#### 2. 页面层（6个文件）
| 文件 | 修改内容 |
|------|---------|
| `app/page.tsx` | 添加 `dynamic` 和 `revalidate` |
| `app/timeline/page.tsx` | 添加 `dynamic` 和 `revalidate` |
| `app/survey/page.tsx` | 添加 `dynamic` 和 `revalidate` |
| `app/survey/[slug]/page.tsx` | 添加 `dynamic` 和 `revalidate` |
| `app/products/page.tsx` | 添加 `dynamic` 和 `revalidate` |
| `app/team/page.tsx` | 添加 `dynamic` 和 `revalidate` |

#### 3. API 路由层（11个文件）
| 文件 | 修改内容 |
|------|---------|
| `app/api/timeline/route.ts` | 添加 `dynamic` 和 `revalidate` |
| `app/api/danmaku/route.ts` | 添加 `dynamic` 和 `revalidate` |
| `app/api/surveys/route.ts` | 添加 `dynamic` 和 `revalidate` |
| `app/api/countdown/route.ts` | 添加 `dynamic` 和 `revalidate` |
| `app/api/admin/timeline/route.ts` | 添加 `dynamic` 和 `revalidate` |
| `app/api/admin/timeline/[eventId]/route.ts` | 添加 `dynamic` 和 `revalidate` |
| `app/api/admin/surveys/route.ts` | 添加 `dynamic` 和 `revalidate` |
| `app/api/admin/surveys/[slug]/route.ts` | 添加 `dynamic` 和 `revalidate` |
| `app/api/admin/danmaku/route.ts` | 添加 `dynamic` 和 `revalidate` |
| `app/api/admin/danmaku/[id]/route.ts` | 添加 `dynamic` 和 `revalidate` |
| `app/api/admin/settings/countdown/route.ts` | 添加 `dynamic` 和 `revalidate` |

#### 4. 配置文件（2个）
| 文件 | 修改内容 |
|------|---------|
| `next.config.js` | 添加 HTTP Cache-Control 响应头 |
| Nginx 站点配置 | 强化缓存控制，区分静态/动态资源 |

**总计修改：23个文件/配置**

---

## 缓存层级

### 完整的缓存层级图

```
┌─────────────────────────────────────────────────────────────┐
│                      浏览器发起请求                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ [层级 1] 浏览器缓存                                          │
│ ─────────────────────────────────────────────────────────── │
│ 解决方案：Nginx 添加响应头                                   │
│ Cache-Control: no-store, no-cache, must-revalidate         │
│ 状态：✅ 已解决                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ [层级 2] Nginx 代理缓存                                      │
│ ─────────────────────────────────────────────────────────── │
│ 解决方案：Nginx 配置                                         │
│ proxy_cache off; proxy_no_cache 1;                          │
│ 状态：✅ 已解决                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 服务器                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ [层级 3] Next.js 页面缓存                                    │
│ ─────────────────────────────────────────────────────────── │
│ 解决方案：页面配置                                           │
│ export const dynamic = 'force-dynamic'                      │
│ 状态：✅ 已解决                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ [层级 4] Next.js 路由缓存                                    │
│ ─────────────────────────────────────────────────────────── │
│ 解决方案：路由配置                                           │
│ export const revalidate = 0                                 │
│ 状态：✅ 已解决                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ [层级 5] Next.js 数据缓存                                    │
│ ─────────────────────────────────────────────────────────── │
│ 解决方案：数据函数中调用                                     │
│ noStore()                                                   │
│ 状态：✅ 已解决                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   SQLite 数据库                              │
└─────────────────────────────────────────────────────────────┘
```

### Cache-Control 指令说明

| 指令 | 含义 |
|------|------|
| `no-store` | 完全禁止缓存，每次都必须从服务器获取 |
| `no-cache` | 可以缓存，但使用前必须验证是否过期 |
| `must-revalidate` | 缓存过期后必须重新验证 |
| `proxy-revalidate` | 代理服务器必须重新验证 |
| `max-age=0` | 缓存立即过期 |
| `public` | 允许任何缓存（CDN、代理）缓存 |
| `immutable` | 内容永不改变，可以永久缓存 |

---

## 核心教训

### 1. 多层缓存需要逐层排查

**Web 应用的缓存层级非常多：**
- 浏览器缓存
- CDN 缓存（如果有）
- 反向代理缓存（Nginx、Apache）
- 应用层缓存（Next.js、Express）
- 数据库缓存
- ORM 缓存（Prisma）

**排查策略：**
- 从底层到顶层：数据库 → 应用 → 代理 → 浏览器
- 在每一层验证数据是否正确
- 不要假设，要实际测试

### 2. 浏览器缓存最容易被忽视

**为什么容易忽视？**
- 开发时经常清除缓存或使用无痕模式
- 服务器端看起来"一切正常"
- HTTP 缓存机制复杂（强缓存 vs 协商缓存）

**关键指标：**
- 状态码 `200`：从服务器获取
- 状态码 `304`：协商缓存（ETag/Last-Modified）
- 状态码 `(disk cache)`/`(memory cache)`：强缓存

**教训：**
- 必须明确设置 `Cache-Control` 响应头
- 对于动态内容，使用 `no-store`
- 对于静态资源，使用 `public, immutable`

### 3. 测试方法至关重要

**有效的测试方法：**

✅ **全新设备测试**
- 排除浏览器缓存影响
- 模拟真实用户首次访问

✅ **HTTP 响应头检查**
```bash
curl -I https://你的域名/页面
```

✅ **逐层验证**
```bash
# 1. 数据库
sqlite3 database.db "SELECT * FROM table;"

# 2. API
curl http://localhost:3000/api/endpoint

# 3. 服务器渲染的 HTML
curl http://localhost:3000/page | grep 关键词

# 4. HTTPS（通过 Nginx）
curl https://你的域名/page | grep 关键词

# 5. 响应头
curl -I https://你的域名/page
```

✅ **浏览器开发者工具**
- Network 标签查看请求状态
- Application 标签清除缓存
- Disable cache 选项

❌ **无效的测试方法：**
- 只在本地测试
- 只在开发模式测试
- 没有清除缓存就测试

### 4. Nginx 配置优先级高于应用层

**重要原则：**
- Nginx 在最外层，可以覆盖应用层的响应头
- 必须在 Nginx 层面正确配置缓存策略
- 区分静态资源和动态内容

**最佳实践：**
```nginx
# 静态资源：长期缓存
location ~* \.(jpg|png|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# 动态内容：不缓存
location / {
    add_header Cache-Control "no-store" always;
}
```

### 5. 文档记录的重要性

**这次排查产出的文档：**
1. `CACHE_FIX_SUMMARY.md` - 技术修复文档
2. `TROUBLESHOOTING_JOURNEY.md` - 故障排查历程（本文档）
3. Nginx 配置备份
4. Git commit 历史

**文档的价值：**
- 方便日后遇到类似问题快速定位
- 帮助团队成员理解架构
- 作为技术债务的记录
- 可以分享给社区帮助他人

### 6. Next.js 14 的缓存机制

**Next.js 14 默认是"激进缓存"策略：**
- 页面默认静态生成
- API 路由默认缓存
- 数据请求默认缓存

**对于需要实时更新的应用：**
- 必须显式禁用每一层缓存
- 理解 `dynamic`、`revalidate`、`noStore` 的作用
- 理解构建时的路由类型：`○` (Static) vs `ƒ` (Dynamic)

**参考文档：**
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Dynamic Functions](https://nextjs.org/docs/app/api-reference/functions/unstable_noStore)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)

---

## 最终效果

### ✅ 功能验证

**测试场景 1：时间线更新**
1. 登录后台，修改时间线 note 为 "测试1"
2. 访问时间线页面 → 显示 "测试1" ✅
3. 修改 note 为 "测试2"
4. **直接刷新浏览器** → 显示 "测试2" ✅
5. 修改 note 为 "测试3"
6. **直接刷新浏览器** → 显示 "测试3" ✅

**测试场景 2：问卷更新**
1. 添加新问卷 "调查问卷 2024"
2. 访问问卷页面 → 显示新问卷 ✅
3. **刷新页面** → 仍然显示新问卷 ✅

**测试场景 3：弹幕更新**
1. 添加弹幕 "Hello World"
2. 访问首页 → 显示新弹幕 ✅
3. **刷新页面** → 仍然显示新弹幕 ✅

### ✅ 性能验证

**动态内容：**
- 响应头：`Cache-Control: no-store`
- 状态码：`200`（每次都从服务器获取）
- 实时性：✅ 立即更新

**静态资源：**
- 响应头：`Cache-Control: public, immutable; max-age=604800`
- 状态码：`304` 或 `(disk cache)`
- 性能：✅ 有效缓存

### ✅ 用户体验

**管理员：**
- ✅ 后台修改立即生效
- ✅ 无需重启服务
- ✅ 无需清除缓存
- ✅ 操作流程顺畅

**访客：**
- ✅ 总是看到最新内容
- ✅ 静态资源加载快速
- ✅ 页面响应及时

### ✅ 技术指标

**路由类型：**
```
Route (app)                                   Size     First Load JS
┌ ƒ /                                         6.42 kB         147 kB
├ ƒ /timeline                                 1.92 kB         128 kB
├ ƒ /survey                                   951 B           136 kB
├ ƒ /products                                 7.25 kB         107 kB
└ ƒ /team                                     3.34 kB         135 kB

ƒ  (Dynamic)  server-rendered on demand
```

**所有动态页面都标记为 `ƒ` ✅**

**响应头验证：**
```bash
$ curl -I https://2025fx.hsfz.live/timeline
cache-control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
pragma: no-cache
```

**✅ Cache-Control 正确配置**

---

## 附录

### A. 相关命令汇总

#### 开发环境
```bash
# 开发模式
npm run dev

# 构建
npm run build

# 生产模式（本地）
npm run start

# Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

#### 生产环境
```bash
# Git 操作
git pull

# 构建
rm -rf .next
npm run build

# PM2
pm2 list
pm2 logs hffx-site --lines 50
pm2 restart hffx-site
pm2 stop hffx-site
pm2 delete hffx-site
pm2 flush

# Nginx
nginx -t
nginx -s reload
systemctl status nginx

# 数据库
sqlite3 prisma/prisma/dev.db "SELECT * FROM Survey;"
sqlite3 prisma/prisma/dev.db "SELECT * FROM TimelineEvent;"

# 测试
curl http://localhost:3000/api/timeline
curl -I https://2025fx.hsfz.live/timeline
```

### B. 代码片段

#### 页面配置
```typescript
// app/timeline/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import TimelineSection from "@/components/sections/Timeline";
import { readTimeline } from "@/lib/timeline";

export default async function TimelinePage() {
  const data = await readTimeline();
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <TimelineSection timeline={data} />
      </div>
    </main>
  );
}
```

#### 数据层
```typescript
// lib/timeline.ts
import { prisma } from "./prisma";
import { unstable_noStore as noStore } from 'next/cache';

export async function readTimeline(): Promise<TimelineData> {
  noStore(); // 禁用数据缓存
  
  const events = await prisma.timelineEvent.findMany({
    orderBy: { order: "asc" },
  });
  
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "timeline_note" },
  });
  
  return {
    note: setting?.value || null,
    events,
  };
}
```

#### API 路由
```typescript
// app/api/timeline/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { readTimeline } from "@/lib/timeline";

export async function GET() {
  const timeline = await readTimeline();
  return NextResponse.json(timeline);
}
```

### C. 参考资源

#### Next.js 文档
- [Caching in Next.js](https://nextjs.org/docs/app/building-your-application/caching)
- [Dynamic Functions](https://nextjs.org/docs/app/api-reference/functions/unstable_noStore)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Configuring: Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)

#### HTTP 缓存
- [MDN: HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Web.dev: HTTP Caching](https://web.dev/http-cache/)

#### Nginx
- [Nginx Caching Guide](https://www.nginx.com/blog/nginx-caching-guide/)
- [Nginx Proxy Module](http://nginx.org/en/docs/http/ngx_http_proxy_module.html)

#### Prisma
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## 结语

这次缓存问题的排查和修复过程，充分体现了**系统化排查方法**的重要性：

1. **不要假设** - 通过实际测试验证每一层
2. **逐层排查** - 从底层到顶层，从服务器到客户端
3. **关键突破** - 全新设备测试揭示了浏览器缓存问题
4. **彻底解决** - 修改了所有5层缓存配置
5. **文档记录** - 为未来的自己和团队留下清晰的路径

**最重要的经验：**
- Web 应用有多层缓存，每一层都可能是问题所在
- 浏览器缓存通过 HTTP 响应头控制，这是最容易被忽视的一层
- Nginx 等反向代理的配置优先级高于应用层
- 有效的测试方法（如全新设备测试）是快速定位问题的关键

现在，网站可以实时响应后台的任何修改，用户体验得到了显著提升！ 🎉

---

**文档版本：** 1.0  
**最后更新：** 2024-11-08  
**维护者：** 华南师大附中返校团队

