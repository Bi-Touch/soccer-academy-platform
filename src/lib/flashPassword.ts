import { cookies } from "next/headers";

const COOKIE_NAME = "flash_temp_password";

export type FlashPassword = {
  password: string;
  email?: string;
  registrationId?: string;
};

/**
 * Passes a temporary password from a server action to the next page
 * without putting it in the URL.
 *
 * The cookie is HTTP-only, restricted to registration pages, secure
 * in production, and expires after two minutes.
 */
export async function setFlashPassword(
  value: FlashPassword
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, JSON.stringify(value), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/registrations",
    maxAge: 120,
  });
}

/**
 * Reads the temporary password, returning null if the cookie is
 * missing, invalid, or does not contain a string password.
 */
export async function readFlashPassword(): Promise<FlashPassword | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;

  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "password" in parsed &&
      typeof parsed.password === "string"
    ) {
      return parsed as FlashPassword;
    }

    return null;
  } catch {
    return null;
  }
}