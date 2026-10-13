
import Link from "next/link";
import {
  CHILD_SECTIONS,
  type ChildSectionKey,
} from "./ChildMenu";

export function ChildPageShell({
  child,
  active,
  children,
}: {
  child: {
    id: string;
    name: string;
    photoUrl: string | null;
    teamName: string | null;
  };
  active: ChildSectionKey;
  children: React.ReactNode;
}) {
  const section = CHILD_SECTIONS.find((s) => s.key === active);

  if (!section) {
    throw new Error(`Unknown child section: ${active}`);
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <Link
        href="/portal/parent"
        style={{
          display: "inline-block",
          color: "var(--pitch)",
          textDecoration: "none",
          fontSize: "0.9rem",
          fontWeight: 600,
          marginBottom: 20,
        }}
      >
        &larr; My Children
      </Link>

      <div
        style={{
          marginBottom: 24,
          paddingBottom: 18,
          borderBottom: "1px solid #e3ded2",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--pitch)",
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          {section.label}
        </div>

        <h1
          className="display"
          style={{
            fontSize: "2rem",
            color: "var(--pitch)",
            margin: 0,
          }}
        >
          {section.title}
        </h1>

        <p
          style={{
            fontSize: "0.9rem",
            opacity: 0.7,
            marginTop: 8,
            lineHeight: 1.6,
          }}
        >
          {section.description}
        </p>

        <p
          style={{
            fontSize: "0.85rem",
            opacity: 0.65,
            marginTop: 10,
          }}
        >
          {child.name} · {child.teamName ?? "No team yet"}
        </p>
      </div>

      {children}
    </div>
  );
}
