"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BRAND_COLOR, brl, brlK } from "@/lib/format-chart";

export type TipData = { x: number; y: number; title: string; rows: Array<{ c?: string; l: string; v: string }>; i?: number };
export type ColumnDatum = {
  k: string; v: number; label: string; cur?: boolean; title?: string; extra?: Array<{ l: string; v: string }>;
};
export type BarRow = { label: string; v: number; sub?: string; extra?: Array<{ l: string; v: string }> };

function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const [w, setW] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => setW(Math.floor(e[0].contentRect.width)));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function niceStep(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}
function escala(maxV: number) {
  const st = niceStep((maxV || 1) / 4);
  const top = Math.max(st, Math.ceil((maxV || 1) / st) * st);
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += st) ticks.push(v);
  return { max: top, ticks };
}

export const Tip = ({ t }: { t: TipData | null }): ReactNode =>
  t ? (
    <div className="tip" style={{ left: t.x, top: t.y }}>
      <b>{t.title}</b>
      {t.rows.map((r, i) => (
        <div key={i}>{r.c && <i style={{ background: r.c }} />}{r.l}<span>{r.v}</span></div>
      ))}
    </div>
  ) : null;

/** Colunas verticais, uma série, topo arredondado e base reta. */
export function Columns({
  data, color = BRAND_COLOR, fmt = brl, fmtAxis = brlK, h = 220, label = "valor",
}: { data: ColumnDatum[]; color?: string; fmt?: (v: number) => string; fmtAxis?: (v: number) => string; h?: number; label?: string }) {
  const [ref, w] = useWidth();
  const [tip, setTip] = useState<TipData | null>(null);
  const pl = 58, pr = 8, pt = 18, pb = 26;
  const W = Math.max(w, 280), ih = h - pt - pb, iw = W - pl - pr;
  const { max, ticks } = escala(Math.max(...data.map((d) => d.v), 0));
  const band = iw / data.length, bw = Math.min(24, band * 0.6);
  const y = (v: number) => pt + ih * (1 - v / max);
  const imax = data.reduce((m, d, i) => (d.v > data[m].v ? i : m), 0), ilast = data.length - 1;
  const bar = (x: number, v: number) => {
    const yy = y(v), b = pt + ih, r = Math.min(4, (b - yy) / 2);
    if (b - yy < 0.5) return "";
    return `M${x},${b}V${yy + r}Q${x},${yy} ${x + r},${yy}H${x + bw - r}Q${x + bw},${yy} ${x + bw},${yy + r}V${b}Z`;
  };
  return (
    <div className="cw" ref={ref} onMouseLeave={() => setTip(null)}>
      {w > 0 && (
        <svg width={W} height={h} role="img" aria-label={label}>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
              <text x={pl - 8} y={y(t) + 4} textAnchor="end">{fmtAxis(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = pl + band * i + (band - bw) / 2;
            return (
              <g key={d.k}>
                <path d={bar(x, d.v)} fill={color} opacity={tip && tip.i !== i ? 0.55 : 1} />
                {(i === ilast || (i === imax && (ilast - imax > 1 || band > 90))) && d.v > 0 && (
                  <text className="v" x={x + bw / 2} y={y(d.v) - 6} textAnchor="middle">{fmtAxis(d.v)}</text>
                )}
                <text x={x + bw / 2} y={h - 8} textAnchor="middle" style={d.cur ? { fontWeight: 700, fill: "var(--fg)" } : undefined}>{d.label}</text>
                <rect
                  x={pl + band * i} y={pt} width={band} height={ih} fill="transparent"
                  onMouseEnter={() => setTip({ i, x: x + bw / 2, y: y(d.v), title: d.title || d.label, rows: [{ c: color, l: label, v: fmt(d.v) }, ...(d.extra || [])] })}
                />
              </g>
            );
          })}
        </svg>
      )}
      <Tip t={tip} />
    </div>
  );
}

/** Barras horizontais em HTML (o texto não escala com o gráfico). */
export function HBars({ rows, color = BRAND_COLOR, fmt = brl, empty }: { rows: BarRow[]; color?: string; fmt?: (v: number) => string; empty?: string }) {
  const [tip, setTip] = useState<TipData | null>(null);
  if (!rows.length) return <span className="muted small">{empty}</span>;
  const max = Math.max(...rows.map((r) => r.v)) || 1;
  return (
    <div className="hb" style={{ position: "relative" }} onMouseLeave={() => setTip(null)}>
      {rows.map((r) => (
        <div
          className="hb-row" key={r.label}
          onMouseEnter={(e) => {
            const b = e.currentTarget.getBoundingClientRect(), pb = (e.currentTarget.parentNode as HTMLElement).getBoundingClientRect();
            setTip({ x: Math.min(b.width / 2, pb.width - 90), y: b.top - pb.top, title: r.label, rows: [{ c: color, l: "Valor", v: fmt(r.v) }, ...(r.extra || [])] });
          }}
        >
          <span className="l">{r.label}{r.sub && <> <small>· {r.sub}</small></>}</span>
          <span className="n">{fmt(r.v)}</span>
          <div className="track"><span style={{ width: `${Math.max(1, (r.v / max) * 100)}%`, background: color }} /></div>
        </div>
      ))}
      <Tip t={tip} />
    </div>
  );
}
