"use client";

import { Fragment } from "react";
import { Empty } from "@/components/ui";
import { I } from "@/components/icons";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import {
  DIA, addDays, corDe, corOS, durOS, firstName, fmtData, fmtHm, hm, pad, parseYmd, relDia, rotaDia, today,
} from "@/lib/format";
import type { OS } from "@/types/domain";
import { OSRow } from "./os-row";

const semanaDe = (day: string) => {
  const wd = (parseYmd(day).getDay() + 6) % 7;
  return [...Array(7)].map((_, i) => addDays(day, i - wd));
};

type Bloco = { o: OS; start: number; end: number; col: number; cols: number };

/** Distribui as OS que se sobrepõem em colunas lado a lado. */
function layoutDia(lista: OS[]): Bloco[] {
  const itens = lista
    .filter((o) => hm(o.hora) != null)
    .map((o) => ({ o, start: hm(o.hora)!, end: hm(o.hora)! + durOS(o), col: 0, cols: 1 }))
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Bloco[] = [];
  let grupo: Bloco[] = [];
  let fim = -1;
  const fecha = () => {
    const cols: number[] = [];
    for (const it of grupo) {
      let c = cols.findIndex((e) => e <= it.start);
      if (c < 0) { c = cols.length; cols.push(0) }
      cols[c] = it.end;
      it.col = c;
    }
    grupo.forEach((it) => (it.cols = cols.length));
    out.push(...grupo);
    grupo = [];
  };
  for (const it of itens) {
    if (grupo.length && it.start >= fim) { fecha(); fim = -1 }
    grupo.push(it);
    fim = Math.max(fim, it.end);
  }
  if (grupo.length) fecha();
  return out;
}

export function DayAgenda({ list, day, setDay, showEquipe }: { list: OS[]; day: string; setDay: (d: string) => void; showEquipe?: boolean }) {
  const { d } = useData();
  const { openM } = useUI();
  const t = today();
  const PX = 60;
  const semana = semanaDe(day);
  const doDia = list.filter((o) => o.data === day && o.status !== "cancelada");
  const blocks = layoutDia(doDia);
  const semHora = doDia.filter((o) => hm(o.hora) == null);
  let h0 = 7, h1 = 19;
  blocks.forEach((b) => { h0 = Math.min(h0, Math.floor(b.start / 60)); h1 = Math.max(h1, Math.ceil(b.end / 60)) });
  h1 = Math.min(h1, 24);
  const y = (m: number) => ((m - h0 * 60) / 60) * PX;
  const H = (h1 - h0) * PX;
  const agora = new Date();
  const nowM = agora.getHours() * 60 + agora.getMinutes();
  const rota = rotaDia(
    doDia.filter((o) => o.status !== "concluida").sort((a, b) => a.hora.localeCompare(b.hora)).map((o) => d.cli[o.clienteId]).filter(Boolean),
  );
  const rd = relDia(day);

  return (
    <div className="sec">
      <div className="ag-week">
        <button className="icon-btn" aria-label="Semana anterior" onClick={() => setDay(addDays(day, -7))}>{I.left}</button>
        {semana.map((k) => {
          const dt = parseYmd(k);
          const n = list.filter((o) => o.data === k && o.status !== "cancelada");
          return (
            <button key={k} className={"ag-day" + (k === t ? " today" : "")} aria-pressed={k === day} aria-label={`${fmtData(k)}, ${n.length} serviços`} onClick={() => setDay(k)}>
              <span>{DIA[dt.getDay()]}</span>
              <b>{dt.getDate()}</b>
              <i>{n.slice(0, 4).map((o, j) => <em key={j} style={{ background: k === day ? "#fff" : corDe(corOS(o, d.serv)).bd }} />)}</i>
            </button>
          );
        })}
        <button className="icon-btn" aria-label="Próxima semana" onClick={() => setDay(addDays(day, 7))}>{I.right}</button>
      </div>

      <div className="sec-h">
        <h2>
          {rd}{["Hoje", "Amanhã", "Ontem"].includes(rd) ? ", " + fmtData(day) : ""}{" "}
          <span className="muted small" style={{ fontWeight: 500, fontFamily: "var(--font-body)" }}>· {doDia.length} {doDia.length === 1 ? "serviço" : "serviços"}</span>
        </h2>
        <div className="acts">
          {day !== t && <button className="btn sm" onClick={() => setDay(t)}>Hoje</button>}
          {rota && <a className="btn sm pri" href={rota} target="_blank" rel="noopener noreferrer">{I.pin} Rota do dia no Maps</a>}
        </div>
      </div>

      {semHora.length > 0 && (
        <div className="card list">
          <div className="day-h">Sem horário definido</div>
          {semHora.map((o) => <OSRow key={o.id} o={o} showDate={false} />)}
        </div>
      )}

      {doDia.length === 0 ? (
        <div className="card"><Empty title="Dia livre" text="Nenhum serviço agendado neste dia." /></div>
      ) : (
        blocks.length > 0 && (
          <div className="card" style={{ padding: "14px 10px 14px 0" }}>
            <div className="ag-grid" style={{ height: H }}>
              <div className="ag-hours">
                {[...Array(h1 - h0 + 1)].map((_, i) => <div key={i} style={{ top: i * PX }}>{pad(h0 + i)}:00</div>)}
              </div>
              <div className="ag-col">
                {[...Array(h1 - h0)].map((_, i) => (
                  <Fragment key={i}>
                    <div className="hl" style={{ top: i * PX }} />
                    <div className="hl half" style={{ top: i * PX + PX / 2 }} />
                  </Fragment>
                ))}
                {day === t && nowM >= h0 * 60 && nowM <= h1 * 60 && <div className="ag-now" style={{ top: y(nowM) }} />}
                {blocks.map((b) => {
                  const o = b.o, c = d.cli[o.clienteId], k = corDe(corOS(o, d.serv));
                  const top = y(b.start) + 1, hgt = Math.max(y(b.end) - y(b.start) - 3, 40), w = 100 / b.cols;
                  const eq = o.funcionarioIds.map((i) => firstName(d.func[i]?.nome)).filter(Boolean).join(", ");
                  return (
                    <button
                      key={o.id}
                      className={"ag-blk" + (o.status === "concluida" ? " done" : "")}
                      style={{ top, height: hgt, left: `calc(${b.col * w}% + 6px)`, width: `calc(${w}% - 8px)`, background: k.bg, borderColor: k.bd, color: k.fg }}
                      onClick={() => openM("osView", { id: o.id })}
                    >
                      <span className="h">
                        {fmtHm(b.start)}–{fmtHm(b.end)}{o.status === "em_andamento" ? " · em andamento" : o.status === "concluida" ? " · concluída" : ""}
                      </span>
                      <span className="c">{c?.nome || "Cliente removido"}</span>
                      {hgt >= 58 && <span className="x">{o.itens.map((i) => i.nome).join(", ")}</span>}
                      {hgt >= 76 && <span className="x">{[c?.bairro, showEquipe ? eq : ""].filter(Boolean).join(" · ")}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
