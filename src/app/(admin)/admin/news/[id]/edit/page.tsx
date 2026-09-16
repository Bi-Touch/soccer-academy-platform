import { prisma } from "@/lib/prisma";
import { updateNewsPost } from "../../actions";
import { notFound } from "next/navigation";

export default async function EditNewsPostPage({ params }: { params: { id: string } }) {
  const post = await prisma.newsPost.findUnique({ where: { id: params.id } });
  if (!post) return notFound();

  const updateWithId = updateNewsPost.bind(null, post.id);

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>EDIT POST</h1>

      <form action={updateWithId} style={{ maxWidth: 560, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Title
          <input name="title" defaultValue={post.title} required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Cover image URL (optional)
          <input name="coverUrl" defaultValue={post.coverUrl ?? ""} placeholder="https://..." style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Excerpt (short summary shown on the news list)
          <textarea name="excerpt" defaultValue={post.excerpt ?? ""} rows={2} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Body
          <textarea name="body" defaultValue={post.body} rows={10} required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Save changes</button>
      </form>
    </div>
  );
}