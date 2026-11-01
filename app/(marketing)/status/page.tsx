import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "System status" };

type DayState = "ok" | "degraded" | "outage";

/* Status palette is fixed and always paired with an icon + label. */
const STATE_STYLES: Record<DayState, { label: string; color: string; icon: typeof CircleCheck }> = {
  ok: { label: "Operational", color: "#0ca30c", icon: CircleCheck },
  degraded: { label: "Degraded", color: "#fab219", icon: TriangleAlert },
  outage: { label: "Outage", color: "#d03b3b", icon: CircleAlert },
};

const DAYS = 90;

/** Illustrative history: days-ago → state; everything else is operational. */
const SERVICES: { name: string; description: string; incidents: Record<number, DayState> }[] = [
  { name: "Web app", description: "Board, backlog and reports", incidents: { 41: "degraded" } },
  { name: "API", description: "REST API and personal access tokens", incidents: { 63: "outage", 62: "degraded", 12: "degraded" } },
  { name: "Live Sync", description: "WebSocket realtime updates", incidents: { 27: "degraded", 26: "degraded" } },
  { name: "GitHub integration", description: "Webhooks and PR linking", incidents: { 8: "degraded" } },
  { name: "Authentication", description: "Email, GitHub and Google sign-in", incidents: {} },
];

function uptime(incidents: Record<number, DayState>) {
  const penalty = Object.values(incidents).reduce((sum, s) => sum + (s === "outage" ? 0.25 : 0.04), 0);
  return (100 - (penalty / DAYS) * 100).toFixed(2);
}

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">System status</h1>
      <p className="mt-3 text-[14px] text-zinc-400">
        Illustrative status data for this portfolio demo — there are no live services behind it.
      </p>

      <div className="mt-8 flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-5 py-4">
        <CircleCheck aria-hidden className="size-5 text-emerald-400" />
        <p className="text-[15px] font-medium text-zinc-100">All systems operational</p>
      </div>

      <section aria-label="Uptime over the last 90 days" className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3 text-[12px] text-zinc-400">
          <span className="font-medium text-zinc-200">Last 90 days</span>
          <span className="ml-auto flex flex-wrap gap-4">
            {(Object.keys(STATE_STYLES) as DayState[]).map((state) => {
              const { label, color, icon: Icon } = STATE_STYLES[state];
              return (
                <span key={state} className="flex items-center gap-1.5">
                  <Icon aria-hidden className="size-3.5" style={{ color }} />
                  {label}
                </span>
              );
            })}
          </span>
        </div>

        <ul className="divide-y divide-line">
          {SERVICES.map((service) => (
            <li key={service.name} className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-zinc-100">{service.name}</p>
                  <p className="text-[12px] text-zinc-500">{service.description}</p>
                </div>
                <p className="shrink-0 text-[12px] text-zinc-400 tabular-nums">{uptime(service.incidents)}% uptime</p>
              </div>
              <div className="mt-3 flex h-7 gap-[2px]" role="img" aria-label={`${service.name}: ${Object.keys(service.incidents).length} days with incidents in the last 90 days`}>
                {Array.from({ length: DAYS }, (_, i) => {
                  const daysAgo = DAYS - 1 - i;
                  const state = service.incidents[daysAgo] ?? "ok";
                  return (
                    <span
                      key={i}
                      title={`${daysAgo === 0 ? "Today" : `${daysAgo} days ago`}: ${STATE_STYLES[state].label}`}
                      className="min-w-0 flex-1 rounded-[2px]"
                      style={{ background: STATE_STYLES[state].color, opacity: state === "ok" ? 0.55 : 1 }}
                    />
                  );
                })}
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-zinc-600">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
