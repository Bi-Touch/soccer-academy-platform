import { ChildHeader } from "./ChildHeader";
import { ChildMenu, CHILD_SECTIONS, type ChildSectionKey } from "./ChildMenu";

export function ChildPageShell({
  child,
  active,
  children,
}: {
  child: { id: string; name: string; photoUrl: string | null; teamName: string | null; position?: string | null };
  active: ChildSectionKey;
  children: React.ReactNode;
}) {
  const section = CHILD_SECTIONS.find((s) => s.key === active)!;
  const subtitle = [child.teamName ?? "No team yet", child.position].filter(Boolean).join(" · ");

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ background: "white", border: "1px solid #e3ded2", borderRadius: 12, padding: 18 }}>
        <ChildHeader name={child.name} photoUrl={child.photoUrl} subtitle={subtitle} backHref="/portal/parent" />

        <div style={{ marginTop: 16 }}>
          <ChildMenu playerId={child.id} active={active} />
        </div>

        <div style={{ borderTop: "1px solid #ece8de", marginTop: 18, paddingTop: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ color: "var(--pitch)", opacity: 0.8, marginTop: 2 }}>{section.icon}</span>
          <div>
            <div style={{ fontWeight: 700 }}>{section.title}</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.65, marginTop: 2 }}>{section.description}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>{children}</div>
    </div>
  );
}
