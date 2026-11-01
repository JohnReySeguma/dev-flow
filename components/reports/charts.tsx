"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/*
 * Hand-rolled SVG charts. Palette validated for the dark surface (#0e0e11):
 * slot 1 blue / slot 2 orange pass CVD + normal-vision separation and 3:1
 * contrast. Text never wears series colour; identity comes from swatches.
 */
export const SERIES_1 = "#3987e5";
export const SERIES_2 = "#d95926";
const GRID = "#1f1f23";
const AXIS_TEXT = "#71717a"; // zinc-500
const REFERENCE = "#52525b"; // zinc-600, for the ideal guideline
const SURFACE = "#0e0e11";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Clean tick step so the axis has at most ~5 round labels. */
function niceTicks(max: number) {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100];
  const step = steps.find((s) => max / s <= 5) ?? 100;
  const top = Math.max(step, Math.ceil(max / step) * step);
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}

function Tooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const flip = x > width - 170;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 min-w-36 rounded-lg border border-line-strong bg-elevated/95 px-3 py-2 text-[12px] shadow-xl backdrop-blur"
      style={{ left: flip ? undefined : x + 12, right: flip ? width - x + 12 : undefined, top: Math.max(0, y - 10) }}
    >
      {children}
    </div>
  );
}

/** Legend key shaped like its mark: a line for line series, a swatch for bars. */
export function LegendItem({ color, label, mark = "line" }: { color: string; label: string; mark?: "line" | "dashed" | "swatch" }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-zinc-400">
      {mark === "swatch" ? (
        <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: color }} />
      ) : (
        <svg width="16" height="8" aria-hidden>
          <line x1="1" x2="15" y1="4" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={mark === "dashed" ? "3 3" : undefined} />
        </svg>
      )}
      {label}
    </span>
  );
}

const M = { top: 12, right: 16, bottom: 28, left: 34 };
const HEIGHT = 240;

/* ------------------------------------------------------------- burndown */

export type BurndownDay = { date: string; ideal: number; remaining: number | null };

export function BurndownChart({ days, label }: { days: BurndownDay[]; label: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => Math.max(d.ideal, d.remaining ?? 0)));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const x = (i: number) => M.left + (days.length > 1 ? (i / (days.length - 1)) * plotW : 0);
  const y = (v: number) => M.top + plotH - (v / top) * plotH;

  const actual = days.flatMap((d, i) => (d.remaining === null ? [] : [{ i, v: d.remaining }]));
  const last = actual[actual.length - 1];
  const labelEvery = Math.ceil(days.length / Math.max(2, Math.floor(plotW / 64)));

  return (
    <div ref={ref} className="relative w-full" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={label}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {t}
              </text>
            </g>
          ))}
          {days.map((d, i) =>
            i % labelEvery === 0 || i === days.length - 1 ? (
              <text key={d.date} x={x(i)} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
              </text>
            ) : null,
          )}

          {/* Ideal guideline: a reference, not a series, so it stays neutral. */}
          <line x1={x(0)} y1={y(days[0]?.ideal ?? 0)} x2={x(days.length - 1)} y2={y(0)} stroke={REFERENCE} strokeWidth={1.5} strokeDasharray="4 4" />

          {actual.length > 1 && (
            <path
              d={actual.map((p, k) => `${k ? "L" : "M"}${x(p.i)},${y(p.v)}`).join(" ")}
              fill="none"
              stroke={SERIES_1}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {last && <circle cx={x(last.i)} cy={y(last.v)} r={4.5} fill={SERIES_1} stroke={SURFACE} strokeWidth={2} />}

          {hover !== null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + plotH} stroke="#3f3f46" strokeWidth={1} />
              {days[hover].remaining !== null && (
                <circle cx={x(hover)} cy={y(days[hover].remaining!)} r={4.5} fill={SERIES_1} stroke={SURFACE} strokeWidth={2} />
              )}
            </>
          )}

          <rect
            x={M.left}
            y={M.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              setHover(Math.round(ratio * (days.length - 1)));
            }}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hover !== null && days[hover] && (
        <Tooltip x={x(hover)} y={y(days[hover].remaining ?? days[hover].ideal)} width={width}>
          <p className="font-medium text-zinc-100">
            {new Date(days[hover].date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
          </p>
          <p className="mt-1 flex items-center justify-between gap-4 text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: SERIES_1 }} /> Remaining
            </span>
            <span className="font-medium text-zinc-100 tabular-nums">{days[hover].remaining ?? "—"}</span>
          </p>
          <p className="flex items-center justify-between gap-4 text-zinc-400">
            <span>Ideal</span>
            <span className="tabular-nums">{Math.round(days[hover].ideal * 10) / 10}</span>
          </p>
        </Tooltip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- velocity */

export type VelocityPoint = { name: string; committed: number; completed: number };

export function VelocityChart({ data, label }: { data: VelocityPoint[]; label: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const ticks = niceTicks(Math.max(1, ...data.flatMap((d) => [d.committed, d.completed])));
  const top = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.min(24, Math.max(6, (band - 16) / 2 - 1));
  const y = (v: number) => M.top + plotH - (v / top) * plotH;
  const baseline = M.top + plotH;

  /** Column with a 4px rounded data-end and a square base. */
  const column = (cx: number, value: number) => {
    const h = baseline - y(value);
    if (h <= 0) return "";
    const r = Math.min(4, h, barW / 2);
    const left = cx;
    const right = cx + barW;
    const topY = baseline - h;
    return `M${left},${baseline} V${topY + r} Q${left},${topY} ${left + r},${topY} H${right - r} Q${right},${topY} ${right},${topY + r} V${baseline} Z`;
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={label}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {t}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const center = M.left + band * i + band / 2;
            // 2px surface gap between the touching pair.
            const committedX = center - barW - 1;
            const completedX = center + 1;
            return (
              <g key={d.name} opacity={hover === null || hover === i ? 1 : 0.45}>
                <path d={column(committedX, d.committed)} fill={SERIES_2} />
                <path d={column(completedX, d.completed)} fill={SERIES_1} />
                <text x={completedX + barW / 2} y={y(d.completed) - 6} textAnchor="middle" fontSize={11} fontWeight={500} fill="#d4d4d8">
                  {d.completed}
                </text>
                <text x={center} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                  {d.name.replace("Sprint ", "S")}
                </text>
                <rect
                  x={M.left + band * i}
                  y={M.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && data[hover] && (
        <Tooltip x={M.left + band * hover + band / 2} y={y(Math.max(data[hover].committed, data[hover].completed))} width={width}>
          <p className="font-medium text-zinc-100">{data[hover].name}</p>
          <p className="mt-1 flex items-center justify-between gap-4 text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm" style={{ background: SERIES_2 }} /> Committed
            </span>
            <span className="tabular-nums text-zinc-100">{data[hover].committed}</span>
          </p>
          <p className="flex items-center justify-between gap-4 text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm" style={{ background: SERIES_1 }} /> Completed
            </span>
            <span className="tabular-nums text-zinc-100">{data[hover].completed}</span>
          </p>
        </Tooltip>
      )}
    </div>
  );
}
