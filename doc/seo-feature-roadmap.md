# Photo To URL 功能升级 & SEO 增长规划

> 文档用途：汇总需求调研、功能升级方案与 SEO 策略，作为后续迭代的参考基线。  
> 产品：[phototourl.com](https://phototourl.com/)  
> 最后更新：2026-06-11

---

## 目录

1. [核心定位转变](#1-核心定位转变)
2. [需求调研：用户载体与资源分析](#2-需求调研用户载体与资源分析)
3. [四大群体权重对比](#3-四大群体权重对比)
4. [三阶段开发路线图](#4-三阶段开发路线图)
5. [SEO 增长关键策略](#5-seo-增长关键策略)
6. [商业变现方案](#6-商业变现方案)
7. [风险与合规](#7-风险与合规)
8. [代码库对接说明](#8-代码库对接说明)
9. [KPI 衡量指标](#9-kpi-衡量指标)
10. [待补充需求区](#10-待补充需求区)
11. [附录](#附录-a-schemaorg-示例)

---

## 1. 核心定位转变

**现状：** 通用型「图片转 URL」工具站，页面以静态工具页为主（首页、`/circle-crop`、`/pdf-to-url`、`/file-to-url` 等）。站内已积累大量垂直场景图片（DLS 球衣、Art Fight 设定图、GTA 贴图、MC 皮肤等），但尚未结构化展示。

**目标：** 从「单一转换工具」进化为 **垂直社群的数字资产托管中心**，把已有精准用户群的图片资源转化为可索引、可回流、可增长的 SEO 资产。

**核心逻辑：**

| 维度 | 当前 | 目标 |
|------|------|------|
| 产品形态 | 通用工具 | 垂直场景解决方案 |
| 流量来源 | 品牌词 + 少量通用词 | 长尾场景词 + UGC 页面 |
| 用户价值 | 获得直链 | 获得直链 + 嵌入代码 + 场景化托管 |
| SEO 资产 | 少量静态页 | 场景 Landing + 公开图库海量页面 |
| 商业定位 | 免费工具 | 创作者工具 + 游戏社区基础设施 |

**市场切入：** 产品已精准切中「元宇宙 / 虚拟资产定制」长尾市场 — 画师、游戏玩家对 **图片外链** 的需求最饥渴、忠诚度最高。

---

## 2. 需求调研：用户载体与资源分析

### 2.1 四大精准用户载体

| 群体 | 典型需求 | 资源现状 | 战略角色 |
|------|----------|----------|----------|
| **DLS 球衣玩家** | 球衣贴图 URL 导入游戏 | 站内已有大量 DLS Kit 图 | SEO 拉新引擎 |
| **Art Fight 画师** | Ref Sheet 托管、HTML/BBCode 嵌入 | 用户自发上传 | 商业变现核心 |
| **俄罗斯 GTA 玩家** | SAMP/MTA 贴图 URL、俄语搜索 | 垂直社群流量 | 流量护城河 |
| **Minecraft 皮肤用户** | 64×64 皮肤 PNG 直链 | 分散长尾需求 | 流量基本盘 |

---

### 2.2 DLS 球衣贴图 — 资源说明（调研结论）

**什么是 DLS Kit Template？**

《Dream League Soccer》（梦幻足球联盟，简称 DLS）允许玩家通过 **图片 URL** 自定义球队球衣。用户上传的「展开图」是 **UV 贴图模板**，游戏读取后将各区域「包裹」到 3D 球员模型上。

**图片结构：**

| 区域 | 说明 |
|------|------|
| 中间长条 | 球衣前胸 + 后背 |
| 两侧对称块 | 左/右袖子 |
| 底部方块 | 短裤各侧面 + 球袜 |
| 标识区 | 赞助商 Logo、球队队徽、作者水印（如 LS KITS） |

**典型使用流程：**

1. 将 `.png` 贴图上传到图床，获取直链
2. 游戏内：**My Club → Customise Team → Edit Kit**
3. 点击 **Download**，粘贴图片 URL，游戏自动应用

**为什么这类图片对 phototourl.com 有价值？**

| 价值点 | 说明 |
|--------|------|
| **刚需高频** | 每赛季/换心情都会搜索新球衣 URL |
| **搜索量巨大** | 全球数千万 DLS 玩家，Google/YouTube/Pinterest 上「DLS 26 Kits URL」搜索量可观 |
| **功能完美对标** | DLS 游戏内 **只能通过 URL 导入**，与产品定位 100% 契合 |
| **SEO 长尾机会** | 结构化页面如「2026 Real Madrid DLS Kit URL」极易排名靠前 |
| **外链自然回流** | 玩家分享、论坛引用 URL → 提升域名权重 |

**待确认（运营）：** 这些图片是用户自发上传，还是计划采集？来源不同，合规与运营策略需区分。

---

### 2.3 Art Fight 画师

- 角色设定图（Ref Sheet）需稳定外链，用于个人资料页展示
- 对 **图片永久可用、原画无损、不被墙** 敏感，付费意愿最高
- 7 月为 Art Fight 年度爆发期，需提前 1 个月布局

### 2.4 俄罗斯 GTA 玩家

- GTA SAMP / MTA 高度依赖论坛、私域群组传播 URL
- 西方图床在俄罗斯不稳定 → **地域壁垒 = 垄断机会**
- 几个大服 Admin 推荐即可带来几十万忠实用户
- 需覆盖 **Google + Yandex** 双搜索引擎

### 2.5 Minecraft 皮肤用户

- 用户基数大但分散，官方启动器 + 现有皮肤站竞争激烈
- URL 加载皮肤为长尾需求，可维持平稳流量
- 爆发力不如 Art Fight / GTA / DLS

---

## 3. 四大群体权重对比

> 权重不能只看流量大小，需综合 **变现潜力、用户忠诚度、竞争壁垒、SEO 贡献** 评估。

### 3.1 综合权重排名

| 排名 | 群体 | 综合权重 | 一句话定位 |
|------|------|----------|-----------|
| 1 | **Art Fight 画师** | ⭐⭐⭐⭐⭐ | 商业权重最高 — 付费意愿 + 品牌溢价 |
| 2 | **俄罗斯 GTA 玩家** | ⭐⭐⭐⭐ | 壁垒权重最高 — 地域垄断 + 社区传播 |
| 3 | **DLS 球衣玩家** | ⭐⭐⭐ | SEO 权重最高 — 搜索拉新引擎 |
| 4 | **Minecraft 皮肤** | ⭐⭐ | 稳定基本盘 — 维持流量，爆发力弱 |

### 3.2 分维度权重矩阵

| 维度 | Art Fight | 俄 GTA | DLS 球衣 | MC 皮肤 |
|------|-----------|--------|----------|---------|
| **商业价值** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **流量规模** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **SEO 增长** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **竞争壁垒** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| **CDN 成本压力** | 低 | 中 | **高**（游戏频繁请求） | 低 |
| **品牌忠诚度** | 高 | 高 | 低（谁快用谁） | 中 |

### 3.3 战略分工（建议）

```
Art Fight  →  付费转化 + 品牌升级（创作者工具）
俄 GTA     →  地域护城河 + Yandex SEO
DLS 球衣   →  Google 搜索霸榜 + 海量 UGC 索引
MC 皮肤    →  长尾覆盖 + 内链支撑
```

### 3.4 开发优先级建议

| 优先级 | 动作 | 理由 |
|--------|------|------|
| P0 | Art Fight 专题页 + HTML/BBCode | 7 月窗口期 + 最高 ARPU |
| P0 | DLS Kit Gallery 结构化展示 | 已有大量存量资源，SEO 回报最快 |
| P1 | `/ru/` GTA 页面人工 SEO | 壁垒高、竞品难复制 |
| P1 | HTML/BBCode 全场景上线 | 所有群体共用，一次开发四处受益 |
| P2 | MC 皮肤 Landing Page | 基本盘，竞争大 |
| P3 | 公开 UGC 图库系统 | 长期索引增长引擎 |

---

## 4. 三阶段开发路线图

### 阶段一：场景落地（预计 1–2 周）

**SEO 目标：** 拦截垂直长尾搜索，曝光量提升 **50%+**

#### 4.1.1 新建场景 Landing Page

参考现有工具页结构（`src/app/[locale]/(site)/` + `messages/*.json`）：

| 路由建议 | 目标群体 | 目标关键词（H1/H2） | 页面要点 |
|----------|----------|---------------------|----------|
| `/art-fight-image-hosting` | Art Fight | Art Fight Character Ref Sheet Hosting, Free HTML Image Embed for Art Fight | 快速上传、嵌入代码、Ref Sheet 教程 |
| `/dls-kit-hosting` | DLS 球员 | DLS Kit URL Generator, Dream League Soccer Custom Kit Hosting | 贴图规格说明、游戏内导入步骤、一键复制 URL |
| `/gta-texture-hosting` | GTA/SAMP/MTA | GTA SAMP Custom Texture Hosting, MTA Texture URL Link Generator | UV 贴图说明、论坛嵌入示例 |
| `/minecraft-skin-hosting` | MC 服主 | Minecraft Skin URL Generator, 64x64 Skin PNG Hosting for Servers | 皮肤规格、服务器引用方式 |

**开发任务：**

- [ ] 新增 4 个 `(site)` 路由页面（含 `(default)` 英文默认路由）
- [ ] `messages/en.json` 及主要语种补充 `metadata.title`、`metadata.description`、Hero 文案
- [ ] 复用现有上传组件，按场景定制默认尺寸/格式提示
- [ ] 更新 `src/app/sitemap.xml/route.ts` 纳入新页面
- [ ] 站内导航 / Footer 增加「Use Cases」分组入口
- [ ] 每页独立 FAQ 区块（3–5 条场景问题）+ `FAQPage` Schema

#### 4.1.2 DLS Kit Gallery（高优先级 — 存量资源变现）

站内已有大量 DLS 球衣图，建议 **优先结构化**：

- [ ] 新建 `/dls-kits` 导航版块（DLS Kit Gallery）
- [ ] 按球队/赛季/联赛分类：`/dls-kits/real-madrid-2026`、`/dls-kits/cruzeiro`
- [ ] 每页展示：贴图预览 + 直链 URL + 一键复制 + 游戏导入教程
- [ ] Title 模板：`{球队名} DLS {赛季} Kit URL | Photo To URL`
- [ ] 标签页：`/dls-kits/tag/brazil`、`/dls-kits/tag/premier-league`
- [ ] 内链：DLS 场景 Landing ↔ 具体球衣页 ↔ 首页上传工具

**SEO 逻辑：** 「DLS 26 Kits URL」「Real Madrid DLS Kit PNG Link」等词搜索量极大，结构化页面可直接霸榜。

#### 4.1.3 Art Fight 专题页（紧急 — 7 月爆发期）

> 距离 7 月 Art Fight 不足一个月，**本周优先上线**。

- [ ] 上线 `/art-fight-quick-upload` 或 `/art-fight-image-hosting`
- [ ] CTA：「Upload & Get Embed Code in 10 Seconds」
- [ ] 社区推广：Art Fight Discord、Reddit（附截图）
- [ ] 博客 1 篇：《How to Host Art Fight Ref Sheets with Direct Links》

#### 4.1.4 SEO 基础配置（每页必做）

- [ ] 唯一 `<title>` / `meta description`（主关键词，≤ 160 字符）
- [ ] 语义化 H1 → H2 → H3
- [ ] Open Graph / Twitter Card（场景定制图）
- [ ] JSON-LD：`WebApplication` + `FAQPage`（见附录 A）
- [ ] 内链：首页、工具页、场景页、博客互链
- [ ] `hreflang`：沿用 `[locale]` 多语言路由

---

### 阶段二：代码增强（预计 2–4 周）

**SEO 目标：** 外部链接回流与品牌提及，Domain Authority 提升

#### 4.2.1 HTML / BBCode / Markdown 一键生成器

**痛点：** 画师和游戏玩家要的是 **可直接粘贴的代码**，不只是 URL。

上传成功后结果区提供 Tab 切换 + 一键复制：

```html
<img src="https://cdn.phototourl.com/xxx.png" alt="Art Fight Ref Sheet">
```

```bbcode
[img]https://cdn.phototourl.com/xxx.png[/img]
```

```markdown
![Art Fight Ref Sheet](https://cdn.phototourl.com/xxx.png)
```

**开发任务：**

- [ ] 上传成功 UI：Tab = URL / HTML / BBCode / Markdown
- [ ] 自定义 `alt` 文本（默认取文件名）
- [ ] 一键复制 + Toast 反馈
- [ ] Dashboard 历史资源同步展示嵌入代码
- [ ] DLS 场景页默认展示 URL Tab（游戏只需 URL）
- [ ] Art Fight / GTA 场景页默认展开 HTML/BBCode Tab

**SEO 逻辑：** 论坛、Art Fight 资料页、游戏 Wiki 粘贴带 `phototourl.com` 的 `<img>` → 搜索引擎识别托管来源 → **图片搜索排名 + 品牌反向引用** 提升。

#### 4.2.2 图片元数据自动填充

- [ ] 上传时可选：标题、描述、标签（tags）
- [ ] 公开页用元数据生成 `<title>`、`alt`、`og:image:alt`
- [ ] SEO 友好文件名：`real-madrid-dls-kit-2026.png`（可选）
- [ ] DLS 页自动识别球队/赛季标签（可选手动 + 未来 AI 标注）

#### 4.2.3 结构化数据增强

- [ ] 工具页：`SoftwareApplication` Schema
- [ ] 上传结果 / 图库详情：`ImageObject` Schema
- [ ] 场景页：`HowTo` Schema（如「3 steps to import DLS kit URL」）

---

### 阶段三：社区画廊（预计 1–2 月）

**SEO 目标：** UGC 驱动索引页面数增长 **10 倍+**

#### 4.3.1 公开分享图库

- [ ] 上传 / Dashboard 增加「公开分享」开关（默认私有）
- [ ] 公开图片自动生成详情页：`/gallery/{slug}` 或 `/i/{id}`
- [ ] 详情页：图片、标题、描述、标签、上传时间、嵌入代码
- [ ] 标签聚合：`/gallery/tag/dls-kit`、`/gallery/tag/art-fight`、`/gallery/tag/minecraft-skin`
- [ ] 分页列表：`/gallery?page=1`
- [ ] 用户可选公开昵称或匿名

**SEO 逻辑：** 1 万用户公开上传 → 1 万个 Google 可索引 URL → 搜索入口与内链网络指数级扩张。

#### 4.3.2 数据库 & API

- [ ] `resources` 表扩展：`is_public`、`slug`、`title`、`description`、`tags`（JSON）、`scene_type`（dls/artfight/gta/mc）
- [ ] API：`GET /api/gallery`、`GET /api/gallery/[slug]`
- [ ] 动态 sitemap：`/sitemap-gallery.xml`
- [ ] `robots.txt` 允许 `/gallery/*`、`/dls-kits/*`

#### 4.3.3 内链网络

- [ ] 标签页 ↔ 详情页 ↔ 场景 Landing 三角互链
- [ ] 相关作品推荐（同标签 4–6 张）
- [ ] 首页「Community Gallery」精选区块
- [ ] DLS Gallery 与通用 Gallery 可合并或分栏展示

#### 4.3.4 合规与风控

- [ ] 公开内容举报 / 下架机制
- [ ] NSFW 检测或用户声明
- [ ] 版权 / DMCA 流程链到 Legal 页
- [ ] DLS 球衣页免责声明（见第 7 节）

---

## 5. SEO 增长关键策略

### 5.1 场景化关键词矩阵

**不要只盯「Image to URL」。** 每个群体独立页面 + 独立关键词集：

#### DLS 球衣（SEO 拉新主力）

| 类型 | 关键词 |
|------|--------|
| 主词 | DLS Kit URL Generator |
| 主词 | Dream League Soccer Custom Kit Hosting |
| 长尾 | DLS 26 Kits URL |
| 长尾 | Real Madrid DLS Kit PNG Link |
| 长尾 | how to import custom kit URL DLS |
| 页面 Title 模板 | `{Team} DLS {Season} Kit URL \| Photo To URL` |

#### Art Fight（商业 + 品牌）

| 类型 | 关键词 |
|------|--------|
| 主词 | Art Fight Character Ref Sheet Hosting |
| 长尾 | Free HTML Image Embed for Art Fight |
| 长尾 | Art Fight ref sheet direct link |
| 长尾 | host art fight character reference online |

#### GTA / SAMP / MTA（俄语 Yandex 重点）

| 类型 | 关键词 |
|------|--------|
| 主词 | GTA SAMP Custom Texture Hosting |
| 长尾 | MTA Texture URL Link Generator |
| 长尾 | GTA SA mod texture direct link |
| 俄语 | хостинг текстур GTA SAMP（`/ru/` 人工撰写） |

#### Minecraft

| 类型 | 关键词 |
|------|--------|
| 主词 | Minecraft Skin URL Generator |
| 长尾 | 64x64 Skin PNG Hosting for Servers |
| 长尾 | minecraft skin direct link for server |

### 5.2 优化「图片直链」传播性

| 群体 | 最需要的输出 | 产品响应 |
|------|-------------|----------|
| DLS | 纯 URL（`.png` 结尾） | 一键复制 URL + 导入教程 |
| Art Fight | HTML / BBCode | 嵌入代码 Tab |
| GTA 论坛 | BBCode `[img]` | BBCode Tab |
| MC 服主 | 直链 + 可选 Markdown | URL + Markdown Tab |

### 5.3 UGC 海量页面策略

| 现状 | 目标 |
|------|------|
| 少量静态工具页 | 静态场景页 + 动态 UGC 详情页 |
| 图片仅存 CDN，无独立 URL 页面 | 每张公开图 = 1 个可索引页面 |
| 内链稀疏 | 标签 / 分类 / 相关推荐形成内链网 |

### 5.4 针对特定群体的「杀手锏」

#### Art Fight — 7 月爆发期（立即行动）

| 动作 | 时间 | 负责人 |
|------|------|--------|
| Art Fight Quick Upload 专题页 | 本周 | 开发 |
| HTML/BBCode MVP | 1–2 周 | 开发 |
| Discord / Reddit 推广 | 上线 48h 内 | 运营 |
| 教程博客 + 内链 | 上线同步 | 内容 |

#### DLS — 存量资源 SEO 化（本周可启动）

| 动作 | 说明 |
|------|------|
| 梳理现有 DLS 图片 | 按球队/赛季分类 |
| 批量生成 Landing 页 | 优先 Top 50 热门球队 |
| YouTube 博主合作 | DLS Kit 频道使用 phototourl 链接 |
| Pinterest 图钉 | DLS 贴图视觉性强，适合 Pinterest SEO |

#### 俄罗斯 GTA — 双搜索引擎

- [ ] `/ru/gta-texture-hosting` **人工撰写** Meta 与正文
- [ ] 注册 Yandex Webmaster，提交 sitemap
- [ ] 俄语 FAQ：贴图格式、SAMP 引用方式
- [ ] VK、俄语 Discord 推广

### 5.5 页面 SEO Checklist

- [ ] Title：`{主关键词} | Photo To URL`
- [ ] Meta Description：1 主词 + 1 长尾 + CTA，≤ 160 字符
- [ ] H1 与 Title 主词一致或高度相关
- [ ] 首段 100 字内出现主关键词
- [ ] ≥ 2 个内链（其他场景页 / 工具页）
- [ ] ≥ 1 个权威外链（Art Fight 官网、Minecraft Wiki、DLS 社区）
- [ ] 图片 `alt` 含关键词变体
- [ ] Core Web Vitals 不劣于现有工具页

---

## 6. 商业变现方案

| 方案 | 具体操作 | 目标群体 | 潜在收益 |
|------|----------|----------|----------|
| **Pro 会员转化** | 高清/去水印/批量上传/永久链接保证 | Art Fight 画师 | $9.9/月订阅 |
| **DLS 导航广告** | DLS Kit Gallery + AdSense 广告位 | DLS 玩家 | 被动广告收入 |
| **社区合作** | YouTube DLS 博主、Art Fight 社区 KOL 使用 phototourl 链接 | DLS + Art Fight | 外链 + 品牌 + 权重 |
| **API 服务** | 为 DLS 贴图 App / MC 皮肤工具提供托管 API | B2B 开发者 | API 调用收费 |
| **俄语市场 Premium** | 俄罗斯 GTA 专属稳定 CDN 线路 | 俄 GTA | 地域溢价订阅 |

**变现优先级：** Art Fight Pro 订阅 > DLS 广告流量 > API B2B > 俄语 Premium

---

## 7. 风险与合规

### 7.1 版权风险（DLS 球衣重点）

- DLS 贴图常含 Nike/Adidas 品牌 Logo、职业俱乐部队徽
- **建议：** 页面增加「用户上传内容」「仅供学习交流」免责声明
- 响应 DMCA 下架流程（链到 `/legal/terms`）
- 公开 Gallery 需举报 / 审核机制

### 7.2 CDN 流量成本（DLS 重点）

- DLS 游戏加载球衣会 **频繁请求** 图片 URL → CDN 成本高
- **建议：**
  - 评估 Pro 定价能否覆盖高请求用户
  - 免费用户限速 / 带宽上限
  - 监控单 URL 请求频率，异常流量告警
  - DLS 场景页说明「建议使用 Pro 获得稳定高速链接」

### 7.3 其他风险

| 风险 | 应对 |
|------|------|
| 用户上传违规内容 | NSFW 检测 + 举报下架 |
| 纯机器翻译俄语页 | `/ru/` 核心页人工优化 |
| 竞品图床价格战（DLS） | Art Fight / 俄 GTA 壁垒市场深耕 |

---

## 8. 代码库对接说明

当前项目：**Next.js App Router + next-intl 多语言**

```
src/app/[locale]/(site)/{场景页}/page.tsx   # 多语言路由
src/app/(default)/{场景页}/page.tsx         # 默认英文路由
src/components/{场景名}/                      # 场景组件
messages/{locale}.json                        # 文案 & metadata
src/app/sitemap.xml/route.ts                  # 静态页 sitemap
```

**可复用：**

- 上传逻辑：首页 / Dashboard 上传流程
- UI 参考：`FileToUrlTool`、`PdfToUrlTool` 结果展示
- i18n：42 个 `messages/*.json`
- SEO：`metadata` export、blog/legal 页面模式

**阶段三新增：**

```
src/app/[locale]/(site)/gallery/[slug]/page.tsx
src/app/[locale]/(site)/dls-kits/[slug]/page.tsx
src/app/api/gallery/route.ts
src/db/schema.ts  — 扩展 resources 字段
```

---

## 9. KPI 衡量指标

| 指标 | 基线（待填） | 阶段一 | 阶段三 |
|------|-------------|--------|--------|
| Google 索引页面数 | — | +50 页（场景+DLS+博客） | +10,000（UGC） |
| 有机搜索曝光（GSC） | — | +50% | +300% |
| DLS 长尾词 Top 20 | 0 | 10+ 词 | 50+ 词 |
| 场景页长尾词 Top 20 | 0 | 5+ 词 | 30+ 词 |
| 外链引用域名数 | — | +10 | +100 |
| URL/嵌入代码复制率 | — | 30% | 50% |
| Pro 转化率（Art Fight 来源） | — | 基线 | +20% |
| DLS 单 URL CDN 请求量 | — | 监控 | 成本可控 |

---

## 10. 待补充需求区

> 后续新需求追加在本表。格式：`[日期] 需求 — 说明`

| 日期 | 需求 | 阶段 | 状态 |
|------|------|------|------|
| 2026-06-11 | 需求调研：四大用户载体分析 | — | ✅ 已完成 |
| 2026-06-11 | DLS Kit 资源说明与 Gallery 规划 | 一 | 待开发 |
| 2026-06-11 | 场景 Landing（Art Fight / DLS / GTA / MC） | 一 | 待开发 |
| 2026-06-11 | Art Fight 7 月爆发期专题页 | 一 | 🔴 紧急 |
| 2026-06-11 | HTML/BBCode/Markdown 一键生成器 | 二 | 待开发 |
| 2026-06-11 | 公开 UGC 图库系统 | 三 | 待规划 |
| 2026-06-11 | `/ru/` GTA 页面人工 SEO + Yandex | 一 | 待开发 |
| 2026-06-11 | DLS 页面版权免责声明 | 一 | 待开发 |
| 2026-06-11 | CDN 流量监控与 Pro 限速策略 | 二 | 待规划 |
| 2026-06-11 | YouTube DLS 博主合作推广 | 运营 | 待启动 |
| | | | |

**待确认事项：**

- [ ] DLS 图片来源：用户自发上传 vs 计划采集？
- [ ] 开发团队规模（影响阶段并行度）
- [ ] 是否需要 Schema.org / HTML 模板更详细示例（可追加附录）

---

## 附录 A：Schema.org 示例

### WebApplication — DLS Kit Hosting

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "DLS Kit URL Generator",
  "url": "https://phototourl.com/dls-kit-hosting",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "description": "Upload Dream League Soccer custom kit templates and get instant PNG direct links for in-game import."
}
```

### HowTo — DLS 导入教程

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Import Custom DLS Kit URL",
  "step": [
    { "@type": "HowToStep", "text": "Upload your kit PNG to Photo To URL" },
    { "@type": "HowToStep", "text": "Copy the direct .png link" },
    { "@type": "HowToStep", "text": "In DLS: My Club → Customise Team → Edit Kit → paste URL" }
  ]
}
```

### FAQPage — Art Fight

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How do I embed my Art Fight ref sheet?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Upload your image, then copy the HTML or BBCode embed code provided instantly."
    }
  }]
}
```

### ImageObject — 公开图库 / DLS 详情页

```json
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "contentUrl": "https://cdn.phototourl.com/real-madrid-dls-kit-2026.png",
  "name": "Real Madrid DLS 2026 Kit",
  "description": "Custom Dream League Soccer kit template with direct URL for in-game import",
  "license": "https://phototourl.com/legal/terms"
}
```

---

## 附录 B：参考链接

- 产品：https://phototourl.com/
- 现有工具页：`/circle-crop`、`/pdf-to-url`、`/file-to-url`
- Google Search Console：（待配置场景页监控）
- Yandex Webmaster：（俄 GTA 页面上线后注册）
- DLS 社区：YouTube「DLS Kits」频道、Reddit r/DreamLeagueSoccer

---

## 总结

Photo To URL 不只是图片转换工具 — 它已握着通往 **垂直游戏 / 创作社区** 的门票，且站内已有大量 DLS 球衣等优质存量资源。

**四大群体分工：**

- **Art Fight** → 付费转化 + 品牌（商业权重最高）
- **俄 GTA** → 地域壁垒 + Yandex（护城河）
- **DLS 球衣** → 搜索霸榜 + UGC 索引（SEO 拉新引擎）
- **MC 皮肤** → 长尾基本盘

**建议执行顺序：**

1. **本周** — Art Fight 专题页 + DLS Kit Gallery 首批 50 队 + HTML/BBCode MVP  
2. **2 周内** — GTA / MC 场景页 + 全站 Schema + `/ru/` 人工优化  
3. **1 月内** — 公开 UGC 图库 API + CDN 成本监控  
4. **持续** — YouTube 博主合作、社区推广、博客内容、Pro 会员转化
