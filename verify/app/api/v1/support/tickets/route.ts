import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/admin-guard";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionFromRequest } from "@/lib/session";
import { cleanInput } from "@/lib/agent-defense";
import { betaPhase } from "@/lib/support/beta";
import { FAKE_SUCCESS, guardPublicForm } from "@/lib/support/form-guard";
import { createTicket, ticketStatus } from "@/lib/support/store";
import { redact, supportReply, triage, type Category } from "@/lib/support/triage";
import { isDisposableEmail } from "@/lib/signup-shield";

const noStore = { "cache-control": "no-store" };
const CATEGORIES: Category[] = ["security", "access", "wallet", "balance", "market", "bug", "abuse", "feedback", "account", "beta", "how-to"];
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

/**
 * POST /api/v1/support/tickets — open a support ticket. { message, category?, contact?, challenge }.
 * PUBLIC-ROUTE: people locked out of the beta must still be able to reach support, so this cannot require a pass.
 * It sits behind the signup shield; the message is triaged and redacted before it is stored; the reply carries a
 * one-time status code that is stored only as a hash.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "support-ticket", 6, 60 * 60_000);
  if (limited) return limited;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const g = await guardPublicForm(req, body);
  if (g.kind === "deny") return g.response;
  if (g.kind === "honeypot") return FAKE_SUCCESS();

  const message = cleanInput(body?.message, 2000);
  if (message.length < 8) return NextResponse.json({ success: false, error: "Tell us a little more about what happened." }, { status: 400 });
  const contactRaw = typeof body?.contact === "string" ? body.contact.trim().slice(0, 254) : "";
  const contact = contactRaw && EMAIL.test(contactRaw) && !isDisposableEmail(contactRaw) ? contactRaw.toLowerCase() : null;
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "Support is offline for a moment. Try the concierge, or email support later." }, { status: 503 });

  const t = triage(message);
  const chosen = CATEGORIES.includes(body?.category as Category) ? (body!.category as Category) : null;
  // A user's chosen category is a hint; code still escalates anything that reads as security or a leaked secret.
  const category = t.category === "security" || !chosen ? t.category : chosen;
  const lane = category === "bug" || category === "security" ? "dev" : "user";
  const severity = t.severity;
  try {
    const ticket = await createTicket(dbQuery(), {
      lane, channel: "form", category, severity,
      summary: redact(message).slice(0, 200), excerpt: redact(message),
      requester: getSessionFromRequest(req)?.address?.toLowerCase() ?? null, contact, phase: betaPhase(),
    });
    return NextResponse.json({ success: true, ref: ticket.ref, token: ticket.token, reply: supportReply({ ...t, category, autoTicket: true }, ticket) }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Could not open a ticket right now." }, { status: 503 });
  }
}

/** GET /api/v1/support/tickets?ref=MG-XXXXXX&token=XXXXXXXXXX — status and public updates of your own ticket. */
export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "support-status", 20, 60_000);
  if (limited) return limited;
  const p = new URL(req.url).searchParams;
  const ref = (p.get("ref") ?? "").trim().toUpperCase();
  const token = (p.get("token") ?? "").trim().toUpperCase();
  if (!/^MG-[A-Z0-9]{6}$/.test(ref) || !/^[A-Z0-9]{10}$/.test(token)) return NextResponse.json({ success: false, error: "Check the ticket number and code." }, { status: 400 });
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "Support is offline for a moment." }, { status: 503 });
  try {
    const s = await ticketStatus(dbQuery(), ref, token);
    if (!s) return NextResponse.json({ success: false, error: "No ticket matches that number and code." }, { status: 404, headers: noStore });
    return NextResponse.json({ success: true, ticket: s }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Support is offline for a moment." }, { status: 503 });
  }
}
