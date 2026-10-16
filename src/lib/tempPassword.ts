import crypto from "crypto";

// No 0/O, 1/l/I, so a password read out over the phone isn't misheard.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateTempPassword(length = 10): string {
  const out: string[] = [];
  while (out.length < length) {
    const byte = crypto.randomBytes(1)[0];
    // 224 = 56 * 4: discard higher bytes so every character is equally likely.
    if (byte < 224) out.push(ALPHABET[byte % ALPHABET.length]);
  }
  return out.join("");
}