import { createNewsPost } from "../actions";

export default function NewNewsPostPage() {
  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ADD POST</h1>

      <form action={createNewsPost} style={{ maxWidth: 560, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Title
          <input name="title" required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Cover image URL (optional)
          <input name="coverUrl" placeholder="https://..." style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Excerpt (short summary shown on the news list)
          <textarea name="excerpt" rows={2} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Body
          <textarea name="body" rows={10} required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Publish post</button>
      </form>
    </div>
  );
}