import { PlayerAvatar } from "@/components/PlayerAvatar";

export function ChildHeader({
  name,
  photoUrl,
  subtitle,
  right,
}: {
  name: string;
  photoUrl: string | null;
  subtitle: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <PlayerAvatar src={photoUrl} alt={name} size={48} rounded />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{name}</div>
        <div style={{ fontSize: "0.85rem", opacity: 0.65, marginTop: 2 }}>{subtitle}</div>
      </div>
      {right}
    </div>
  );
}