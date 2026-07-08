"use client";

/**
 * MAD Gambit — Agentic State Machine (in-app)
 * ------------------------------------------------------------------
 * Surfaces the LangGraph state machines (previously only "exterior"
 * backend graphs) as a first-class, live in-app feature. Renders both
 * agent pipelines as node-graphs and drives the real endpoints:
 *
 *   SCRAPER  START → discovery → reasoning → vector → END   (/api/v1/agents/scraper)
 *   TRADER   START → surveillance → validation → execution → END (/api/v1/agents/trader)
 *
 * Live run animates node status and shows the real returned state.
 * If the endpoint 500s (no GEMINI_API_KEY / DATABASE_URL in preview) it
 * degrades to a clearly-badged SIMULATED pass so the machine always reads
 * as alive for demos. INK design tokens; reduced-motion friendly.
 */

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Radar, BrainCircuit, Database, Eye, ShieldCheck, Rocket, Play, Loader2, CheckCircle2, Cpu } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";

type NodeStatus = "idle" | "active" | "done" | "error";
interface GraphNode { id: string; label: string; icon: React.ReactNode; }
interface Pipeline {
  key: "scraper" | "trader";
  title: string;
  endpoint: string;
  accent: string;
  nodes: GraphNode[];
  summarize: (data: any) => string;
}

const PIPELINES: Pipeline[] = [
  {
    key: "scraper",
    title: "SCANDAL SCRAPER",
    endpoint: "/api/v1/agents/scraper",
    accent: INK.cyan,
    nodes: [
      { id: "discovery", label: "Discovery", icon: <Radar className="w-4 h-4" /> },
      { id: "reasoning", label: "Reasoning", icon: <BrainCircuit className="w-4 h-4" /> },
      { id: "vector", label: "Vector Store", icon: <Database className="w-4 h-4" /> },
    ],
    summarize: (d) =>
      `${d?.rawNews?.length ?? 0} discovered · ${d?.analyzedEvents?.length ?? 0} analyzed · ${d?.vectorIds?.length ?? 0} vectorized`,
  },
  {
    key: "trader",
    title: "CULL ARENA TRADER",
    endpoint: "/api/v1/agents/trader",
    accent: INK.gold,
    nodes: [
      { id: "surveillance", label: "Surveillance", icon: <Eye className="w-4 h-4" /> },
      { id: "validation", label: "Validation", icon: <ShieldCheck className="w-4 h-4" /> },
      { id: "execution", label: "Execution", icon: <Rocket className="w-4 h-4" /> },
    ],
    summarize: (d) =>
      `status: ${d?.validationStatus ?? "—"}${d?.signedTx ? ` · tx ${String(d.signedTx).slice(0, 10)}…` : ""}`,
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function PipelineRow({ pipe }: { pipe: Pipeline }) {
  const [status, setStatus] = useState<Record<string, NodeStatus>>(() =>
    Object.fromEntries(pipe.nodes.map((n) => [n.id, "idle"]))
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    setSimulated(false);
    setStatus(Object.fromEntries(pipe.nodes.map((n) => [n.id, "idle"])));

    // fire the real graph invocation in parallel with the node animation
    const req = fetch(pipe.endpoint, { method: "POST" })
      .then(async (r) => ({ ok: r.ok, json: await r.json().catch(() => null) }))
      .catch(() => ({ ok: false, json: null }));

    // animate nodes stepping through the graph
    for (const n of pipe.nodes) {
      setStatus((s) => ({ ...s, [n.id]: "active" }));
      await sleep(700);
      setStatus((s) => ({ ...s, [n.id]: "done" }));
    }

    const res = await req;
    if (res.ok && res.json?.success) {
      setResult(pipe.summarize(res.json.data));
    } else {
      // endpoint needs GEMINI_API_KEY + DATABASE_URL — degrade to a badged sim
      setSimulated(true);
      setResult(
        pipe.key === "scraper"
          ? "12 discovered · 5 analyzed · 5 vectorized"
          : "status: VALIDATED · tx 0xa1b2c3d4…"
      );
    }
    setRunning(false);
  }, [pipe, running]);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: INK.border, background: "rgba(3,5,8,0.6)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: pipe.accent, boxShadow: `0 0 8px ${pipe.accent}` }} />
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest" style={{ color: pipe.accent }}>
            {pipe.title}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-wider" style={{ color: INK.muted }}>LangGraph</span>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-60"
          style={{ background: `${pipe.accent}1f`, color: pipe.accent, border: `1px solid ${pipe.accent}55` }}
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {running ? "Running" : "Run"}
        </button>
      </div>

      {/* node graph */}
      <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
        <NodeChip label="START" color={INK.muted} status="done" icon={<Cpu className="w-4 h-4" />} />
        {pipe.nodes.map((n) => (
          <React.Fragment key={n.id}>
            <Connector active={status[n.id] !== "idle"} color={pipe.accent} />
            <NodeChip label={n.label} color={pipe.accent} status={status[n.id]} icon={n.icon} />
          </React.Fragment>
        ))}
        <Connector active={Object.values(status).every((s) => s === "done")} color={pipe.accent} />
        <NodeChip label="END" color={INK.green} status={Object.values(status).every((s) => s === "done") ? "done" : "idle"} icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>

      {result && (
        <div className="mt-3 flex items-center gap-2 font-mono text-[10px]" style={{ color: INK.white }}>
          <span style={{ color: INK.green }}>▸ final state:</span>
          <span>{result}</span>
          {simulated && (
            <span className="px-1.5 py-0.5 rounded uppercase tracking-wider text-[8px] font-bold" style={{ background: `${INK.gold}22`, color: INK.gold }}>
              simulated · set GEMINI_API_KEY + DATABASE_URL for live
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function NodeChip({ label, color, status, icon }: { label: string; color: string; status: NodeStatus; icon: React.ReactNode }) {
  const active = status === "active";
  const done = status === "done";
  const on = active || done;
  return (
    <motion.div
      animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.7, repeat: active ? Infinity : 0 }}
      className="shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 min-w-[74px]"
      style={{
        border: `1px solid ${on ? color : INK.border}`,
        background: on ? `${color}14` : "rgba(255,255,255,0.02)",
        boxShadow: active ? `0 0 16px -4px ${color}` : "none",
      }}
    >
      <span style={{ color: on ? color : INK.muted }}>{icon}</span>
      <span className="font-mono text-[8px] font-bold uppercase tracking-wide text-center" style={{ color: on ? color : INK.muted }}>
        {label}
      </span>
    </motion.div>
  );
}

function Connector({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="shrink-0 self-center w-4 h-0.5 rounded-full transition-colors duration-300" style={{ background: active ? color : INK.border }} />
  );
}

export default function StateMachineView() {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: INK.border, background: "rgba(8,10,18,0.55)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Cpu className="w-4 h-4" style={{ color: INK.gold }} />
        <h3 className="font-mono text-sm font-bold uppercase tracking-widest" style={{ color: INK.white }}>
          Agentic State Machine
        </h3>
      </div>
      <p className="font-mono text-[9px] uppercase tracking-wider mb-4" style={{ color: INK.muted }}>
        LangGraph pipelines · live in-app · Discovery → Reasoning → Vector · Surveillance → Validation → Execution
      </p>
      <div className="space-y-3">
        {PIPELINES.map((p) => <PipelineRow key={p.key} pipe={p} />)}
      </div>
    </div>
  );
}
