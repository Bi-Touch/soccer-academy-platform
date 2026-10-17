import { cookies } from "next/headers";

const COOKIE_NAME = "flash_temp_password";

export type FlashPassword = {
  password: string;
  email?: string;
  registrationId?: string;
};

/**
 * Hands a temporary password from a server action to the next page without putting it in the URL.
 *
 * The cookie is httpOnly (page scripts can't read it), sent only to the registrations pages,
 * only over HTTPS in production, never on cross-site requests, and expires after 2 minutes.
 * Unlike a query string it does not end up in browser history, the address bar, or request logs.
 */
export function setFlashPassword(value: FlashPassword) {
  cookies().set(COOKIE_NAME, JSON.stringify(value), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/registrations",
    maxAge: 120,
  });
}

/** Read the password handed over by the previous action, or null if there isn't one (or it expired). */
export function readFlashPassword(): FlashPassword | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.password === "string" ? (parsed as FlashPassword) : null;
  } catch {
    return null;
  }
}
