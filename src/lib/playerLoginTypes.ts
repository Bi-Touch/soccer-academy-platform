export type PlayerLoginResult =
  | { ok: true; email: string; tempPassword: string; emailAttempted: boolean }
  | { ok: false; error: string };