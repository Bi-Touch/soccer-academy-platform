import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteNewsPost } from "./actions";
import { SearchableTable } from "@/components/SearchableTable";

export default async function AdminNewsPage() {
  const posts = await prisma.newsPost.findMany({
    orderBy: { publishedAt: "desc" },
  });

  const rows = posts.map((post) => ({
    id: post.id,
    label: post.title,
    node: (
      <>
        <td style={{ padding: "10px 16px" }}>{post.title}</td>
        <td style={{ padding: "10px 16px" }}>{post.publishedAt.toLocaleDateString()}</td>
        <td style={{ padding: "10px 16px", textAlign: "right" }}>
          <Link href={`/admin/news/${post.id}/edit`} style={{ marginRight: 16, fontSize: "0.9rem" }}>
            Edit
          </Link>
          <form action={deleteNewsPost.bind(null, post.id)} style={{ display: "inline" }}>
            <button
              type="submit"
              style={{ background: "none", border: "none", color: "var(--card-red)", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}
            >
              Remove
            </button>
          </form>
        </td>
      </>
    ),
  }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>NEWS</h1>
        <Link href="/admin/news/new" className="button">+ Add Post</Link>
      </div>

      <div style={{ marginTop: 24 }}>
        <SearchableTable
          columns={["Title", "Published", ""]}
          rows={rows}
          minWidth={500}
          placeholder="Search posts by title..."
          emptyMessage='No posts yet — click "Add Post" to publish the first one.'
        />
      </div>
    </div>
  );
}