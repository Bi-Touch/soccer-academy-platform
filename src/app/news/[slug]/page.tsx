import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.newsPost.findUnique({ where: { slug: params.slug } });
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      images: post.coverUrl ? [{ url: post.coverUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function NewsPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.newsPost.findUnique({ where: { slug: params.slug } });
  if (!post) return notFound();

  return (
    <>
      <SiteHeader />
      <article className="container" style={{ padding: "64px 24px", maxWidth: 720 }}>
        <Link href="/news" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Back to news</Link>

        <h1 className="display" style={{ fontSize: "2.6rem", color: "var(--pitch)", marginTop: 16 }}>
          {post.title}
        </h1>
        <p style={{ fontSize: "0.85rem", opacity: 0.6, marginTop: 8 }}>
          {post.publishedAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </p>

        {post.coverUrl && (
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", marginTop: 24 }}>
            <Image
              src={post.coverUrl}
              alt={post.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 100vw, 720px"
              priority
            />
          </div>
        )}

        <div style={{ marginTop: 32, lineHeight: 1.7, whiteSpace: "pre-line" }}>
          {post.body}
        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #e3ded2" }}>
          <ShareButtons title={post.title} />
        </div>
      </article>
      <SiteFooter />
    </>
  );
}