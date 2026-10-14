import Link from "next/link";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export function ChildHeader({
  name,
  photoUrl,
  subtitle,
  right,
  backHref,
}: {
  name: string;
  photoUrl: string | null;
  subtitle: React.ReactNode;
  right?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {backHref && (
        <Link
          href={backHref}
          aria-label="Back to My Children"
          title="Back to My Children"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#f4f3ef",
            color: "var(--pitch)",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      )}
      <PlayerAvatar src={photoUrl} alt={name} size={48} rounded />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{name}</div>
        <div style={{ fontSize: "0.85rem", opacity: 0.65, marginTop: 2 }}>{subtitle}</div>
      </div>
      {right}
    </div>
  );
}