"use server";

import { prisma } from "@/lib/prisma";

export async function submitContactForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !message) {
    return { ok: false, error: "Name, email, and message are required." };
  }

  await prisma.contactSubmission.create({
    data: { name, email, phone, message },
  });

  return { ok: true };
}