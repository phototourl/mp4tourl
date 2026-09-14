import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteUrl } from "@/app/seo-metadata";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBlogPostBySlug } from "@/lib/blog-posts";
import MarkdownContent from "@/components/shared/MarkdownContent";
import { Calendar, Clock, ArrowLeft, Github, Twitter } from "lucide-react";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = routing.defaultLocale;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const tPost = await getTranslations({ locale, namespace: `blog.posts.${slug}` });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const title = tPost("title");
  const description = tPost("description");
  const siteName = tCommon("siteName");
  const canonicalPath = `/blog/${slug}`;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;

  // Build hreflang for all locales
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = l === locale
      ? `${siteUrl}${canonicalPath}`
      : `${siteUrl}/${l}${canonicalPath}`;
  }

  return {
    title: `${title} | ${siteName} Blog`,
    description: description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title: title,
      description: description,
      url: canonicalUrl,
      siteName: siteName,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      ...(post.image && { images: [{ url: post.image, alt: title }] }),
    },
    twitter: {
      title: title,
      description: description,
      card: "summary_large_image",
      ...(post.image && { images: [post.image] }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = routing.defaultLocale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog.page" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const { slug } = await params;

  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const tPost = await getTranslations({ locale, namespace: `blog.posts.${slug}` });
  const title = tPost("title");
  const description = tPost("description");
  const content = tPost("content");
  const canonicalUrl = `${siteUrl}/blog/${slug}`;

  // Article schema for this blog post
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": post.image ? [`${siteUrl}${post.image}`] : [],
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Organization",
      "name": post.author,
      "url": siteUrl,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Photo To URL",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/icons/light_58x58.png`,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
    <article className="mx-auto max-w-4xl px-6 py-12">
      {/* Back to blog link */}
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToBlog")}
      </Link>

      {/* Article header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          {title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{post.readTime} {t("minRead")}</span>
          </div>
          {post.category && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {post.category}
            </span>
          )}
        </div>

        {post.image && (
          <div className="relative w-full rounded-lg bg-slate-100 mb-8">
            <img
              src={post.image}
              alt={title}
              className="w-full h-auto"
            />
          </div>
        )}

        <p className="text-xl text-slate-600 leading-relaxed">
          {description}
        </p>
      </header>

      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        <MarkdownContent content={content} />
      </div>

      {/* Tags section */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4">{t("tags")}</p>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-white text-slate-900 rounded-full text-sm font-medium border border-slate-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* About Photo To URL Team */}
      <div className="mt-8 bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <img
              src="/favicon.png"
              alt={tCommon("siteName")}
              className="w-16 h-16 rounded-full"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {t("about.title")}
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              {t("about.subtitle")} · Photo To URL
            </p>
            <p className="text-sm text-slate-600 mb-4">
              {t("about.description")}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                Image optimization
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                Core Web Vitals
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                Web performance
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <a
                href="https://github.com/phototourl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
              >
                <Github className="h-4 w-4" />
                {t("about.github")}
              </a>
              <a
                href="https://x.com/phototourl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
              >
                <Twitter className="h-4 w-4" />
                {t("about.twitter")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
    </>
  );
}
