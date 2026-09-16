import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GalleryGrid } from "@/components/GalleryGrid";
import { prisma } from "@/lib/prisma";

export default async function GalleryPage() {
  const photos = await prisma.galleryPhoto.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px" }}>
        <h1 className="display" style={{ fontSize: "3rem", color: "var(--pitch)", marginBottom: 40 }}>
          GALLERY
        </h1>
        {photos.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No photos yet.</p>
        ) : (
          <GalleryGrid photos={photos} />
        )}
      </section>
      <SiteFooter />
    </>
  );
}