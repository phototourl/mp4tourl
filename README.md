# Photo To URL  🌐 **https://phototourl.com**

<div align="center">

**Turn photos into clean, shareable links in seconds.**

[![Website](https://img.shields.io/badge/Website-phototourl.com-teal?style=for-the-badge)](https://phototourl.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-13-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

</div>



## ✨ Features

- 🚀 **Fast & Simple** - Upload and get a shareable link in seconds
- 🔗 **Clean URLs** - Direct image links ready for Markdown, HTML, and chat apps
- 📋 **Clipboard Friendly** - Paste screenshots directly from clipboard
- ☁️ **Cloudflare R2 Support** - Optional CDN-backed hosting for fast delivery
- 🌍 **Multi-language** - 42 locales (EN variants, ZH, ES, FR, DE, JP, KO, AR, and more)
- 🎨 **Free tier without signup** - Try free: 5 uploads/day, 2MB per file; sign in or upgrade for higher limits
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

Copy `env.example` to `.env.local` (or set in Vercel):

```env
# Required
NEXT_PUBLIC_SITE_URL=https://phototourl.com
# Optional - Cloudflare R2 (if empty, falls back to local storage)
R2_BUCKET=your-bucket-name
R2_ENDPOINT=your-r2-endpoint
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_PUBLIC_BASE_URL=your-cdn-url
```


### Deploy

1. Push to GitHub and connect to [Vercel](https://vercel.com)
2. Add your environment variables in Vercel dashboard
3. Deploy! 🎉

### Docker / Dokploy 部署（Analytics 生效说明）

Next.js 会把 `NEXT_PUBLIC_*` 在**构建时**写进前端代码，所以必须在**构建阶段**传入，仅填运行时环境变量无效。

**推荐做法：** 在 Dokploy 的 **Build Environment Variables**（构建时环境变量）里添加：

| 变量 | 示例值                                |
|------|------------------------------------|
| `NEXT_PUBLIC_SITE_URL` | `https://phototourl.com`           |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | `G-*********`                      |

保存后**重新构建并部署**。自检：浏览器打开 `view-source:https://phototourl.com`，搜索 `G-MJP605Q6WY`，若存在则 GA 已生效。

## 📁 App 路由结构（`src/app/[locale]`）

- **`(site)/`**：营销站与工具页外壳（`SiteHeader` + 主内容 + `SiteFooter`、统计与结构化数据）。首页、Blog、各工具页等放在此组下，URL **不变**（路由组名不出现在路径里）。
- **`(protected)/`**：登录后工作台（左侧 `DashboardSidebar` + 右侧 `SidebarInset`），**不再**包一层营销顶栏/页脚，避免破坏左右分栏布局。视觉与排版参考同仓库 **`editstamp`** 的 `(protected)` + `dashboard-01`：`data-dashboard-shell` 下为浅灰画布、白顶栏、蓝靛侧栏高亮；`tailwind.config.js` 已补充 `sidebar` 色板（`var(--sidebar*)`）以正确应用 `bg-sidebar` 等类。
- **`auth/`**：登录/注册等，当前无营销顶栏页脚（如需与站点一致，可再单独包一层 layout）。

受保护路径与 `src/routes.ts` 中 `protectedRoutes` 一致，并由 `middleware.ts` 校验登录。

**工作台「我的资源」：** `src/app/[locale]/(protected)/dashboard/page.tsx` 中 **My Resources** 卡片使用 **一个** `Tabs` 根组件包裹标题栏的 `TabsList` 与 `CardContent` 里的 `TabsContent`，默认 `table`（表格列表），可切换到 `grid`（照片墙）。历史上若拆成两个 `Tabs`，会导致切换无反应。

### 工作台「设置」页（参考 editstamp 的卡片布局）

登录后进入 **`/[locale]/settings/*`**（侧栏「设置」子菜单）：

| 路径 | 作用 | 主要组件 |
|------|------|----------|
| `settings/profile` | 资料与头像 | `update-avatar-card`、原有姓名表单 |
| `settings/billing` | 套餐与用量 | `billing-card`（读 `/api/resources`） |
| `settings/security` | 密码 / 重置 / 删号 | `password-card-wrapper`、`update-password-card`、`reset-password-card`、`delete-account-card`；是否显示「改密码」由 `use-has-credential-provider`（`/api/auth/list-accounts`）判断 |
| `settings/notifications` | 邮件订阅说明 | `newsletter-form-card`（开关为占位，受 `websiteConfig.newsletter.enable` 控制） |

**依赖说明：** 账号相关使用 **better-auth**（`authClient.changePassword`、`deleteUser` 等）。若服务端未配置密码重置邮件，重置卡片会提示不可用。文案在 `messages/en.json`、`messages/zh.json` 的 `Dashboard.settings` 下。

**样式注意：** 当前依赖为 **Tailwind CSS 3.3.x**，不含 `size-*` 简写；图片/图标请用 `h-* w-*`，否则类名不生效时 Next `Image` 会按 `width`/`height` 属性显示得很大。工作台侧栏顶部的 Logo + 站点名与 `SiteHeader` 对齐（`dashboard-sidebar.tsx`）。

## 🛠️ Tech Stack

- **Framework:** [Next.js 13](https://nextjs.org/) with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Internationalization:** [next-intl](https://next-intl-docs.vercel.app/)
- **Storage:** Cloudflare R2 (optional) or local storage
- **Deployment:** Vercel

## 📋 多语言与博客文案校验

修改或新增 `messages/*.json` 中的博客文案后，请运行：

```bash
npm run validate:blog
```
或：`node scripts/validate-blog-posts.js`

脚本会检查：

- 所有 JSON 可正常解析
- `blog.posts` 下存在四个博客 slug（与 `src/lib/blog-posts.ts` 一致），且均为**直接子键**，无嵌套
- 每个博客项包含 `title`、`description`、`content` 三个字符串
- 源码中无「圆角博客 content 后仅逗号再接去背景」的典型嵌套错误


若报错，请按提示修正对应语言的 `blog.posts` 结构（例如圆角与去背景必须是两个同级键，圆角对象需用 `},` 正确闭合）。

## 🌐 Related Products

Check out our other tools:

- [Circle Crop Image](https://circlecropimage.qzboat.com) - Round the corners of images
- [Discord Wrapped](https://discordwarpped.qzboat.com) - Personalized Discord stats
- [qzboat](https://www.qzboat.com) - Professional AI SaaS Platform

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [phototourl](https://github.com/phototourl)

[Website](https://phototourl.com) · [GitHub](https://github.com/phototourl/phototourl) · [Twitter](https://x.com/phototourl)

</div>

