import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { deleteNewsPost } from "./actions";



export default async function AdminNewsPage() {

  const posts = await prisma.newsPost.findMany({

    orderBy: { publishedAt: "desc" },

  });



  return (

    <div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>NEWS</h1>

        <Link href="/admin/news/new" className="button">+ Add Post</Link>

      </div>



      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>

        <thead>

          <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>

            <th style={{ padding: "8px 0" }}>Title</th>

            <th>Published</th>

            <th></th>

          </tr>

        </thead>

        <tbody>

          {posts.map((post) => (

            <tr key={post.id} style={{ borderBottom: "1px solid #e3ded2" }}>

              <td style={{ padding: "8px 0" }}>{post.title}</td>

              <td>{post.publishedAt.toLocaleDateString()}</td>

              <td style={{ textAlign: "right" }}>

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

            </tr>

          ))}

          {posts.length === 0 && (

            <tr>

              <td colSpan={3} style={{ padding: "24px 0", opacity: 0.7 }}>

                No posts yet — click "Add Post" to publish the first one.

              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>

  );

}