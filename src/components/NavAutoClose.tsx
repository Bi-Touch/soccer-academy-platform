"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Closes the mobile drawer after a navigation. It only unticks the drawer's
 * checkbox, so the desktop collapse state and each group's open/closed state
 * are left alone and survive page changes.
 */
export function NavAutoClose() {
  const pathname = usePathname();

  useEffect(() => {
    const box = document.getElementById("nav-toggle") as HTMLInputElement | null;
    if (box) box.checked = false;
  }, [pathname]);

  return null;
}