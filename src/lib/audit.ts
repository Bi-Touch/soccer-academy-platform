import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit, type AuditEntry } from "@/lib/auditCore";

export { diffFields } from "@/lib/auditCore";

export async function logAudit(entry: AuditEntry): Promise<void> {
  let actor = entry.actor;
  if (actor === undefined) {
    const session = await getServerSession(authOptions);
    actor = session?.user
      ? { id: session.user.id, name: session.user.name, role: session.user.role }
      : null;
  }
  await writeAudit({ ...entry, actor });
}