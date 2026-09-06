import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export default async function NewsPage() {
  const posts = await prisma.newsPost.findMany({
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px", maxWidth: 720 }}>
        <h1 className="display" style={{ fontSize: "3rem", color: "var(--pitch)", marginBottom: 40 }}>
          NEWS
        </h1>
        {posts.length === 0 && <p style={{ opacity: 0.7 }}>No posts published yet.</p>}
        {posts.map((post) => (
          <article key={post.id} style={{ borderBottom: "1px solid #e3ded2", padding: "24px 0" }}>
            <h2 className="display" style={{ fontSize: "1.8rem" }}>{post.title}</h2>
            <p style={{ opacity: 0.75, marginTop: 8 }}>{post.excerpt}</p>
          </article>
        ))}
      </section>
      <SiteFooter />
    </>
  );
}
