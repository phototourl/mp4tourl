# Cloudflare R2 被盗刷应急修复与长期防御指南

> 一个真实案例:某开发者的 R2 代理 Worker 一个月被刷了 **224M 请求**、**159TB 带宽**,每天账单 $18+,缓存命中率仅 **0.47%**。本文记录完整的排查、止血、加固全过程,并给出可以直接抄的配置方案。

## 目录

- [问题背景](#问题背景)
- [第一步:定位攻击](#第一步定位攻击)
- [第二步:紧急止血](#第二步紧急止血)
- [第三步:自动化防御](#第三步自动化防御)
- [第四步:架构优化(治本)](#第四步架构优化治本)
- [日常监控](#日常监控)
- [常见误区](#常见误区)

---

## 问题背景

Cloudflare R2 对外宣传"零出站费用",但这不意味着免费。真正烧钱的通常是**前面那层 Worker 代理**。很多人用类似下面这种结构把 R2 暴露给公网:

```
用户 → 自定义域名 → Worker(鉴权/防盗链/路由)→ R2
```

一旦被恶意刷量,会踩到几个坑:

1. **Worker 请求数按次收费**(付费版 $0.30/百万请求),缓存命中也算一次 Worker 请求
2. **R2 Class B 操作费**(读取)按次计费
3. 缓存键设计不当会让命中率极低,几乎每个请求都回源
4. 没有防护规则时，单 IP 可以不受限地刷请求（与产品上传配额无关，指攻击流量）

本文讲的就是怎么从"被刷懵"到"彻底挡住"。

---

## 第一步:定位攻击

### 1.1 打开 Workers Analytics 看命中率

**Dashboard → Analytics & Logs → Workers**

重点看三个数字:

- **Total requests**(总请求)
- **Cached requests**(缓存命中)
- **Uncached requests**(回源次数)

**健康值参考**:静态资源代理的缓存命中率应该在 **90% 以上**。如果你的命中率低于 50%,要么是缓存键有 bug,要么就是被刷了。

> 真实案例:Total 184M / Cached 857k / Uncached 183M → 命中率 0.47%,极度异常。

### 1.2 看流量曲线的形状

- **正常业务**:曲线平滑,有明显的日/周周期
- **被刷**:平时很低,突然出现 5M~8M 的尖峰,且时间不规律

如果你看到"平时几乎是 0,某个时间点突然炸到几百万",基本可以确定是脚本在刷。

### 1.3 打开 Security Analytics 抓凶手

**Dashboard → Security → Analytics**(部分新版界面里已经把 Events 合并到这里)

把时间范围切到 **Last 24 hours**,看下面这几个面板:

| 面板 | 看什么 | 异常信号 |
|---|---|---|
| **Top Source IPs** | 哪些 IP 请求最多 | 连号 IP(`.248/.249/.250`)= 同一个机房 |
| **Top Countries** | 流量国家分布 | 某个国家占比异常高(如 63%)|
| **Source device types** | 设备类型占比 | Tablet 占 60%+ = 伪造 UA |
| **Source OS / Browsers** | 系统和浏览器 | Unknown/Others 占大头 = 脚本 |
| **Cache statuses** | Hit / Miss 比例 | Hit 比例低得离谱 |
| **HTTP versions** | HTTP/1.1 vs HTTP/2 vs HTTP/3 | HTTP/1.1 占比过高 = 老旧爬虫 |

### 1.4 真实案例数据

```
Total: 15.75M (24 小时)
Countries: Pakistan 9.98M (63%), US 1.13M, Indonesia 621k
Device: Tablet 10.14M (64%)
OS: Unknown/Others 12.77M
Browsers: Unknown/Others 12.55M
Security actions Block: 842  ← 几乎没拦
```

结论:**IP 池攻击,来源集中在巴基斯坦,伪造 UA,几乎没有防护**。

---

## 第二步:紧急止血

目标:10 分钟内把流量压下来。按优先级执行。

### 2.1 封禁异常来源国家

如果业务不面向某个国家,直接国家级封禁最快最彻底。

**Security → Security rules → Custom rules → Create rule**:

- **Rule name**: `block-bad-countries`
- **Expression**(点 Edit expression):

```
(ip.src.country in {"PK" "ID"})
```

- **Action**: `Block`
- **Deploy**

> ⚠️ 如果合法用户里有少量来自这些国家,改用 `Managed Challenge` 代替 `Block`,让真人能过验证、脚本过不去。

### 2.2 封禁可疑 IP 段

**Top IPs 里出现连号 IP,必须整段封禁**,只封单个 IP 完全没用(攻击者会换邻居)。

新建第二条规则:

- **Rule name**: `block-bad-ips`
- **Expression**:

```
(ip.src in {113.217.250.0/24}) or (ip.src in {2a02:4780::/29})
```

几个常见的机房 IP 段,根据实际情况加入黑名单:

| 提供商 | IP 段 | 说明 |
|---|---|---|
| Contabo (DE) | `2a02:4780::/29` | 廉价 VPS,刷量高发 |
| DigitalOcean | ASN `14061` | 机房 IP |
| AWS | ASN `16509` | 机房 IP |
| Google Cloud | ASN `15169` | 机房 IP |
| Hetzner | ASN `24940` | 机房 IP |
| OVH | ASN `16276` | 机房 IP |

> 用 ASN 封整个云厂商更彻底。表达式:`ip.src.asnum in {14061 16509 15169 24940 16276}`。正常用户基本不会从这些 ASN 访问静态资源。

### 2.3 验证规则生效

部署后到 **Security → Analytics → Events** 里,按规则 ID 筛选,应该能看到大量 `Action: Block` 的记录在滚动。同时看 Traffic 页面,总请求数应该开始下降。

**如果流量没掉**:攻击者可能已经在换战术了,立刻进入第三步。

---

## 第三步:自动化防御

手动黑名单永远追不上攻击者换 IP 的速度。真正能让你睡好觉的是**自动化防御**。

### 3.1 开启 Bot Fight Mode(免费,一个开关)

**Security → Settings → Bots → Bot Fight Mode** → 打开

这是 Cloudflare 自带的免费机器人识别,会自动挑战一眼就能看出是脚本的请求(`python-requests`、`curl`、headless 浏览器等)。**零配置,直接生效**,对伪造 UA 的脚本特别有效。

### 3.2 配置限流规则(最关键)

这是防御的核心。无论攻击者换 IP、换国家、换 UA,只要刷得快就自动被封。

**Security → Security rules → Rate limiting rules → Create rule**:

| 字段 | 值 |
|---|---|
| **Rule name** | `rate-limit-r2` |
| **Expression** | `(starts_with(http.request.uri.path, "/r2/"))` |
| **Characteristics** | IP address |
| **Requests** | `20` |
| **Period** | `10 seconds` |
| **Action** | `Block` |
| **Duration** | `10 seconds`(免费版只有这个)或更长(付费版)|

**阈值怎么选**:

- 保守(怕误伤):`50 / 10s`
- 标准(推荐):`20 / 10s`
- 激进(纯静态资源):`10 / 10s`

**免费版的限制**:

- 只能建 1 条限流规则
- Period 锁死 10 秒
- Duration 锁死 10 秒
- Action 只有 Block

但即使这样,这一条规则也能挡住 80% 以上的攻击。因为攻击脚本是死循环,被封 10 秒之后立刻会再次触发,等于持续被封。

> 💡 如果你每天 Worker 费用已经 $5+,升级 Cloudflare Pro($20/月)是划算的,能解锁更长的窗口和更长的封禁时间。

### 3.3 挑战可疑 User-Agent(可选)

如果攻击者在用伪造 UA,加一条挑战规则:

```
(starts_with(http.request.uri.path, "/r2/") and (
  http.user_agent eq "" or
  lower(http.user_agent) contains "python" or
  lower(http.user_agent) contains "curl" or
  lower(http.user_agent) contains "go-http" or
  lower(http.user_agent) contains "wget"
))
```

Action: **Managed Challenge**

---

## 第四步:架构优化(治本)

前三步是防守,这一步是从架构上**降低被刷的代价**,让即使防守失败,成本也低到可以忽略。

### 4.1 修复 Worker 代码的缓存 bug

典型的有问题写法:

```javascript
// ❌ 问题:带查询参数的请求会把缓存拆得粉碎
const cacheKey = new Request(url.toString(), { method: 'GET' });
```

`?v=1`、`?t=abc` 这种参数会让每个变体都是独立缓存,命中率极低。

正确写法:

```javascript
// ✅ 去掉查询参数,共享缓存
const cacheUrl = new URL(url);
cacheUrl.search = '';
const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
```

### 4.2 修复 Range 请求污染缓存

典型问题:

```javascript
// ❌ 把 206 Partial Content 缓存了,后续全量请求会拿到残片
if (rangeHeader) upstreamHeaders.set('Range', rangeHeader);
const res = await fetch(targetUrl, { headers: upstreamHeaders });
// ... 后面把 res 写进缓存
```

正确做法:Range 请求直接回源,不读缓存也不写缓存。

```javascript
// ✅ Range 请求绕过缓存
if (rangeHeader) {
  const upstreamHeaders = new Headers();
  upstreamHeaders.set('Range', rangeHeader);
  return fetch(targetUrl, { method: 'GET', headers: upstreamHeaders });
}
```

### 4.3 修复 HEAD 请求返回 body

HTTP 规范要求 HEAD 响应没有 body,但很多代码会把 GET 的 body 直接返回。

```javascript
// ✅ HEAD 请求返回空 body
if (request.method === 'HEAD') {
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
```

### 4.4 完整的修复后 Worker 代码

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/r2/')) {
      return fetch(request);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const parts = url.pathname.split('/');
    const bucketId = parts[2];
    const key = parts.slice(3).join('/');

    if (!bucketId || !key) {
      return new Response('Not Found', { status: 404 });
    }

    // 路径穿越防护
    if (key.includes('..')) {
      return new Response('Forbidden', { status: 403 });
    }

    // Referer 白名单防盗链
    const allowedHosts = (env.ALLOWED_REFERERS || '').split(',').filter(Boolean);
    if (allowedHosts.length > 0) {
      const referer = request.headers.get('Referer');
      if (referer) {
        try {
          const refHost = new URL(referer).hostname;
          if (!allowedHosts.some(h => refHost === h || refHost.endsWith('.' + h))) {
            return new Response('Forbidden', { status: 403 });
          }
        } catch {
          return new Response('Forbidden', { status: 403 });
        }
      }
    }

    const origin = env[`R2_${bucketId.toUpperCase()}_PUBLIC_URL`];
    if (!origin) {
      return new Response('Unknown bucket', { status: 404 });
    }

    const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const targetUrl = `${base}/${key}`;

    // Range 请求直接回源,不走缓存
    const rangeHeader = request.headers.get('Range');
    if (rangeHeader) {
      const upstreamHeaders = new Headers();
      upstreamHeaders.set('Range', rangeHeader);
      const rangeRes = await fetch(targetUrl, {
        method: 'GET',
        headers: upstreamHeaders,
      });
      const rangeRespHeaders = new Headers(rangeRes.headers);
      rangeRespHeaders.set('Access-Control-Allow-Origin', '*');
      return new Response(
        request.method === 'HEAD' ? null : rangeRes.body,
        { status: rangeRes.status, headers: rangeRespHeaders }
      );
    }

    // 缓存键去掉查询参数,避免缓存碎片化
    const cacheUrl = new URL(url);
    cacheUrl.search = '';
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
    const cache = caches.default;

    let response = await cache.match(cacheKey);
    if (response) {
      if (request.method === 'HEAD') {
        return new Response(null, {
          status: response.status,
          headers: response.headers,
        });
      }
      return response;
    }

    const res = await fetch(targetUrl, {
      method: 'GET',
      cf: {
        cacheEverything: true,
        cacheTtl: 86400,
        cacheTtlByStatus: {
          '200-299': 86400,
          '404': 60,
          '500-599': 0,
        },
      },
    });

    const headers = new Headers(res.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    const cacheableResponse = new Response(res.body, {
      status: res.status,
      headers,
    });

    if (res.status >= 200 && res.status < 300) {
      ctx.waitUntil(cache.put(cacheKey, cacheableResponse.clone()));
    }

    if (request.method === 'HEAD') {
      return new Response(null, {
        status: cacheableResponse.status,
        headers: cacheableResponse.headers,
      });
    }

    return cacheableResponse;
  },
};
```

### 4.5 添加 Cache Rule(让请求根本不进 Worker)

**这一步的降费效果比改代码还大**。Cache Rule 让 Cloudflare 在 **Worker 之前**就缓存响应,命中的请求根本不进 Worker,不计 Worker 请求费。

**Caching → Cache Rules → Create rule**:

| 字段 | 值 |
|---|---|
| **Rule name** | `cache-r2-paths` |
| **Field** | URI Path |
| **Operator** | starts with |
| **Value** | `/r2/` |
| **Cache eligibility** | Eligible for cache |
| **Edge TTL** | Override origin → 1 day(或更长)|
| **Browser TTL** | Override origin → 1 day |

### 4.6 终极方案:R2 自定义域名 + 纯 Cache Rule(推荐)

**如果你的业务不需要复杂的 Worker 逻辑**,最佳实践是**完全不用 Worker**:

1. R2 → Bucket → Settings → **Custom Domains** → 绑定自定义域名
2. 绑定的域名自动走 Cloudflare CDN,默认就有边缘缓存
3. 防盗链用 **WAF Custom Rules**(免费)
4. 限流用 **Rate Limiting Rules**(免费)

这种架构下:

- ✅ Worker 费用 = $0
- ✅ R2 Class B 费用极低(只在缓存未命中时回源)
- ✅ 防护同样强
- ✅ 自带 HTTPS 和全球 CDN

**前提**:你的 URL 结构要能改。如果旧链接已经散布在外,需要用 Redirect Rules 做兼容。

---

## 日常监控

防御部署完不意味着一劳永逸。建议设置以下习惯:

### 每周检查

**Security → Analytics**:
- Total vs Mitigated 的比例
- Top Countries 有没有新的异常国家
- Mitigated by Cloudflare 数字是否在增长(说明防护在持续起作用)

### 每月检查

**Billing & Payments**:
- Workers 请求数是否异常
- R2 Class A/B 操作数是否异常
- 总账单是否稳定

### 设置账单告警

**Billing → Notifications** → 设置账单阈值告警,超过预算立刻邮件通知,避免一觉醒来账单炸裂。

### 推荐的告警阈值

根据业务规模设置,以下是一个参考:

- **个人小站**:Workers 请求数 > 1M/天 报警
- **小型项目**:Workers 请求数 > 10M/天 报警
- **中型项目**:Workers 请求数 > 100M/天 报警

---

## 常见误区

### ❌ 误区 1:"我开了缓存就安全了"

缓存命中**不免除 Worker 请求费**。只要请求进了 Worker,就计费。解决:用 Cache Rule 在 Worker 之前拦截,或者去掉 Worker。

### ❌ 误区 2:"封单个 IP 就够了"

攻击者用 IP 池,单封 IP 追不过来。解决:封网段 / 封 ASN / 封国家 / 上限流。

### ❌ 误区 3:"Managed Challenge 总是比 Block 好"

Managed Challenge 对**已经确定是攻击源**的 IP 是浪费资源(发挑战页面本身也有开销)。确定的恶意 IP 直接 Block,可疑的才用 Challenge。

### ❌ 误区 4:"免费版限流 10 秒封禁太弱,没用"

即使只封 10 秒,攻击脚本是死循环,被封后立刻再次触发,等于持续被封。降速效果非常明显。

### ❌ 误区 5:"R2 宣传零出站费,用 R2 肯定便宜"

R2 本身零出站费,但你前面的 **Worker 按请求计费**。被刷的主要账单往往在 Worker,不在 R2。

### ❌ 误区 6:"Bot Fight Mode 是付费功能"

**免费版也有 Bot Fight Mode**,只是付费版的 Super Bot Fight Mode 功能更强。免费的也能挡掉大部分脚本。

---

## 一键部署清单

遇到被刷,按这个清单一条条过,15 分钟内止血:

- [ ] **Security → Analytics** 查看攻击特征(国家、IP、UA)
- [ ] **Security → Custom Rules** 封禁异常国家(`ip.src.country in {"XX"}`)
- [ ] **Security → Custom Rules** 封禁异常 IP 段(`ip.src in {x.x.x.0/24}`)
- [ ] **Security → Rate Limiting** 加限流规则(`20/10s` per IP)
- [ ] **Security → Settings → Bots** 开启 Bot Fight Mode
- [ ] **Caching → Cache Rules** 加 Cache Rule 让请求不进 Worker
- [ ] 修 Worker 代码:缓存键去查询参数 + Range 绕过缓存 + HEAD 不返回 body
- [ ] **Billing** 设置账单告警
- [ ] 持续观察 24 小时确认止血

---

## 总结

R2 被盗刷的本质不是 R2 的问题,是**前面代理层的防护缺失**。核心防御思路:

1. **分层防御**:国家封禁 → IP 黑名单 → 限流 → Bot 识别,一层不够就叠加
2. **自动化优先**:手动黑名单永远慢攻击者一步,限流和 Bot Fight Mode 才是长期解法
3. **架构降本**:让请求尽量别进 Worker,进了也命中缓存,从源头降低被刷代价
4. **最佳实践**:静态资源优先用 R2 自定义域名 + Cache Rule,不走 Worker

希望这篇文章能帮你省下一笔不必要的云账单,也能让你在被刷时不再慌乱。

---

*最后更新:2026 年*
