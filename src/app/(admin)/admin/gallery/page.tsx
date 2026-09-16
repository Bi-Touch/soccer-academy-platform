import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { deletePhoto } from "./actions";

export default async function AdminGalleryPage() {
  const photos = await prisma.galleryPhoto.findMany({
    include: { team: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>GALLERY</h1>
        <Link href="/admin/gallery/new" className="button">+ Add Photo</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginTop: 24 }}>
        {photos.map((photo) => (          
          <div key={photo.id} style={{ background: "white" }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "4/3" }}>
              <Image src={photo.url} alt={photo.caption ?? ""} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 50vw, 180px" />
            </div>>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: "0.85rem" }}>{photo.caption ?? "No caption"}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: 2 }}>{photo.team?.name ?? "All teams"}</div>
              <form action={deletePhoto.bind(null, photo.id)} style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  style={{ background: "none", border: "none", color: "var(--card-red)", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}
                >
                  Remove
                </button>
              </form>
            </div>
          </div>
        ))}
        {photos.length === 0 && <p style={{ opacity: 0.7 }}>No photos yet — click "Add Photo" to upload the first one.</p>}
      </div>
    </div>
  );
}