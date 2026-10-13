import Link from "next/link";

export type ChildSectionKey = "profile" | "stats" | "reports" | "schedule" | "consent" | "videos";

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const CHILD_SECTIONS: {
  key: ChildSectionKey;
  label: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "profile",
    label: "Profile",
    title: "Child's profile",
    description: "Personal details, team and notes from the coaching staff.",
    icon: (
      <Svg>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </Svg>
    ),
  },
  {
    key: "stats",
    label: "Stats",
    title: "Child's stats",
    description: "Season totals and career history.",
    icon: (
      <Svg>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </Svg>
    ),
  },
  {
    key: "reports",
    label: "Reports",
    title: "Child's reports",
    description: "Training, assessments, physical tests and match performance.",
    icon: (
      <Svg>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <polyline points="14 3 14 8 19 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </Svg>
    ),
  },
  {
    key: "schedule",
    label: "Schedule",
    title: "Child's schedule",
    description: "Upcoming and recent sessions and matches for the team.",
    icon: (
      <Svg>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </Svg>
    ),
  },
  {
    key: "consent",
    label: "Consent",
    title: "Consent & privacy",
    description: "What you have agreed the Academy may collect, record and share.",
    icon: (
      <Svg>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </Svg>
    ),
  },
  {
    key: "videos",
    label: "Videos",
    title: "Child's videos",
    description: "Training footage, match highlights and coach-shared videos.",
    icon: (
      <Svg>
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </Svg>
    ),
  },
];

export function ChildMenu({ playerId, active }: { playerId: string; active?: ChildSectionKey }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {CHILD_SECTIONS.map((s) => (
        <Link
          key={s.key}
          href={`/portal/parent/${playerId}/${s.key}`}
          className={s.key === active ? "child-tile active" : "child-tile"}
          aria-current={s.key === active ? "page" : undefined}
        >
          {s.icon}
          <span>{s.label}</span>
        </Link>
      ))}
    </div>
  );
}