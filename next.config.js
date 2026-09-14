// next-intl 插件指向请求配置（App Router 推荐）
const withNextIntl = require("next-intl/plugin")("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker/standalone 部署：输出独立运行目录，便于镜像精简
  output: "standalone",
  experimental: {
    // Allow large video uploads through App Router / Server Actions
    serverActions: {
      bodySizeLimit: "110mb",
    },
  },
  webpack: (config) => {
    // 忽略 onnxruntime-web 的 source map 文件
    config.module.rules.push({
      test: /\.map$/,
      include: /node_modules\/onnxruntime-web/,
      loader: "ignore-loader",
    });
    return config;
  },
  // 性能优化：压缩输出
  compress: true,
  // 性能优化：禁用 SWC 压缩，使用 Terser（onnxruntime-web 需要 Terser 才能正确处理 ESM）
  swcMinify: false,
  // Docker/standalone：关闭服务端图片优化，避免 /_next/image → Sharp「Input Buffer is empty」刷屏
  // （本地静态图经内部 mock 拉取偶发空 buffer；静态资源直接由 public 提供即可）
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/gh/lipis/flag-icons/**',
      },
    ],
  },
  outputFileTracingIncludes: {
    '*': ['./node_modules/sharp/**/*', './node_modules/@img/**/*'],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/favicon.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // 默认语言英文不带前缀：避免 /en 与 / 重复内容
      {
        source: "/en",
        destination: "/",
        permanent: true,
      },
      {
        source: "/en/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/app",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
