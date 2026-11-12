import { Fragment } from "react";
import { MES, brl, fmtMes } from "@/lib/format";

export type SerieMes = { k: string; fa: number; sa: number };

/** Faturado x saídas dos últimos meses (colunas lado a lado). */
export function Bars({ serie, atual }: { serie: SerieMes[]; atual: string }) {
  const W = 600, H = 220, pl = 56, pb = 26, pt = 10;
  const max = Math.max(1, ...serie.flatMap((s) => [s.fa, s.sa]));
  const nice = ((v: number) => {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const m = v / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  })(max);
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / nice);
  const gw = (W - pl) / serie.length;
  const bw = Math.min(28, gw / 3.2);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * nice);
  const k = (v: number) => (v >= 1000 ? (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil" : String(Math.round(v)));

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Faturado e saídas por mês">
        {ticks.map((t, i) => (
          <Fragment key={i}>
            <line x1={pl} x2={W} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={pl - 8} y={y(t) + 4} textAnchor="end">{k(t)}</text>
          </Fragment>
        ))}
        {serie.map((s, i) => {
          const cx = pl + gw * i + gw / 2;
          return (
            <g key={s.k}>
              <rect x={cx - bw - 2} y={y(s.fa)} width={bw} height={Math.max(0, H - pb - y(s.fa))} rx="4" fill="var(--green)" opacity={s.k === atual ? 1 : 0.7}>
                <title>Faturado {fmtMes(s.k)}: {brl(s.fa)}</title>
              </rect>
              <rect x={cx + 2} y={y(s.sa)} width={bw} height={Math.max(0, H - pb - y(s.sa))} rx="4" fill="var(--sky-ink)" opacity={s.k === atual ? 0.6 : 0.4}>
                <title>Saídas {fmtMes(s.k)}: {brl(s.sa)}</title>
              </rect>
              <text x={cx} y={H - 8} textAnchor="middle" style={s.k === atual ? { fontWeight: 700, fill: "var(--fg)" } : undefined}>{MES[+s.k.slice(5) - 1]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
