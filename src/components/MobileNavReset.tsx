"use client";

import { usePathname } from "next/navigation";

export function MobileNavReset({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} style={{ display: "contents" }}>
      {children}
    </div>
  );
}