import { NextResponse } from "next/server";
import { can, type AdminSession } from "@/lib/admin-auth";
import { dbQuery, isDenied, requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { cleanInput } from "@/lib/agent-defense";
import { createTicket, listTickets, queueStats, ticketEvents, ticketLane, TICKET_STATUSES, updateTicket, type TicketStatus } from "@/lib/support/store";
import { redact, type Lane, type Severity } from "@/lib/support/triage";
import { betaPhase } from "@/lib/support/beta";

const noStore = { "cache-control": "no-store" };

/** The lanes a staff member may see: support staff → user; developers → dev + staff; admins and the master → all. */
function lanesFor(s: AdminSession): Lane[] {
  const lanes: Lane[] = [];
  if (can(s.role, "support:user")) lanes.push("user");
  if (can(s.role, "support:dev")) lanes.push("dev", "staff");
  return lanes;
}

async function anySupportRole(req: Request) {
  const s = await requireAdmin(req);
  if (isDenied(s)) return s;
  if (!lanesFor(s).length) return NextResponse.json({ success: false, error: "Your role has no support queue." }, { status: 403 });
  return s;
}

/** GET /api/admin/support[?status=&id=] — the caller's queues (or one ticket's history), plus open counts by lane. */
export async function GET(req: Request) {
  const s = await anySupportRole(req);
  if (s instanceof Response) return s;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: true, lanes: lanesFor(s), tickets: [], stats: [], source: "demo" }, { headers: noStore });
  const q = dbQuery();
  const p = new URL(req.url).searchParams;
  try {
    const id = Number(p.get("id"));
    if (Number.isInteger(id) && id > 0) {
      const lane = await ticketLane(q, id);
      if (!lane || !lanesFor(s).includes(lane)) return NextResponse.json({ success: false, error: "No such ticket in your queues." }, { status: 404 });
      return NextResponse.json({ success: true, events: await ticketEvents(q, id) }, { headers: noStore });
    }
    return NextResponse.json({ success: true, lanes: lanesFor(s), tickets: await listTickets(q, lanesFor(s), { status: p.get("status") }), stats: await queueStats(q) }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Could not read the queue (has sql/0022 been applied?)." }, { status: 503 });
  }
}

/** PATCH /api/admin/support — { id, status?, assignee?, note?, publicNote? }. Only within the caller's lanes. */
export async function PATCH(req: Request) {
  const s = await anySupportRole(req);
  if (s instanceof Response) return s;
  const limited = enforceRateLimit(req, "admin-support", 120, 60_000);
  if (limited) return limited;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "No database is configured." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, error: "A valid id is required." }, { status: 400 });
  const q = dbQuery();
  const lane = await ticketLane(q, id).catch(() => null);
  if (!lane || !lanesFor(s).includes(lane)) return NextResponse.json({ success: false, error: "No such ticket in your queues." }, { status: 404 });
  const status = (TICKET_STATUSES as readonly unknown[]).includes(body?.status) ? (body!.status as TicketStatus) : undefined;
  const assignee = body && "assignee" in body ? (typeof body.assignee === "string" && body.assignee.trim() ? body.assignee.trim().slice(0, 254) : null) : undefined;
  const note = body?.note ? cleanInput(body.note, 2000) : undefined;
  const publicNote = body?.publicNote ? cleanInput(body.publicNote, 1000) : undefined;
  try {
    await updateTicket(q, id, s.sub, { status, assignee, note, publicNote });
    await audit(getDbPool(), s.sub, "ticket-update", `#${id}${status ? ` ${status}` : ""}`);
    return NextResponse.json({ success: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Could not update the ticket." }, { status: 503 });
  }
}

/** POST /api/admin/support — file an INTERNAL staff ticket (platform, ops, content). { summary, category?, severity? }. */
export async function POST(req: Request) {
  const s = await requireAdmin(req, "support:dev");
  if (isDenied(s)) return s;
  const limited = enforceRateLimit(req, "admin-support-new", 30, 60_000);
  if (limited) return limited;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "No database is configured." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const summary = cleanInput(body?.summary, 2000);
  if (summary.length < 4) return NextResponse.json({ success: false, error: "Describe the issue." }, { status: 400 });
  const severity: Severity = ["P1", "P2", "P3", "P4"].includes(String(body?.severity)) ? (body!.severity as Severity) : "P3";
  const category = typeof body?.category === "string" ? body.category.replace(/[^a-z-]/g, "").slice(0, 24) || "ops" : "ops";
  try {
    const t = await createTicket(dbQuery(), { lane: "staff", channel: "staff", category, severity, summary: redact(summary).slice(0, 200), excerpt: redact(summary), requester: s.sub, phase: betaPhase() });
    await audit(getDbPool(), s.sub, "ticket-internal", t.ref);
    return NextResponse.json({ success: true, ref: t.ref }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Could not file the ticket." }, { status: 503 });
  }
}
