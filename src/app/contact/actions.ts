"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function submitContactForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !message) {
    return { ok: false, error: "Name, email, and message are required." };
  }

  const created = await prisma.contactSubmission.create({
    data: { name, email, phone, message },
  });

  // Public form, so there is no signed-in actor. The submitter's name, email, phone and message
  // are not copied into the log; the enquiry itself holds them. The request IP is recorded automatically.
  await logAudit({
    action: "enquiry.submit",
    entityType: "ContactSubmission",
    entityId: created.id,
    summary: "New enquiry received from the contact form",
    changes: { hasPhone: Boolean(phone), messageLength: message.length },
  });

  return { ok: true };
}
