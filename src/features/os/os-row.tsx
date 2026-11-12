"use client";

import { Fragment } from "react";
import { Empty, Pill } from "@/components/ui";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import { MES, brl, corDe, corOS, firstName, fmtDC, numOS, parseYmd, relDia, rotuloNf, temNf } from "@/lib/format";
import type { OS } from "@/types/domain";

export function OSRow({ o, showDate = true }: { o: OS; showDate?: boolean }) {
  const { d } = useData();
  const { openM } = useUI();
  const c = d.cli[o.clienteId];
  const nomes = o.funcionarioIds.map((i) => firstName(d.func[i]?.nome)).filter(Boolean).join(", ");
  const dt = parseYmd(o.data);
  return (
    <button className="row" onClick={() => openM("osView", { id: o.id })}>
      {showDate ? (
        <div className="when"><b>{dt.getDate()}</b><span>{MES[dt.getMonth()]}</span></div>
      ) : (
        <div className="when"><b style={{ fontSize: ".95rem" }}>{o.hora || "--:--"}</b><span>hora</span></div>
      )}
      <div className="main">
        <div className="t">
          <span className="dot" style={{ background: corDe(corOS(o, d.serv)).bd }} />
          {c?.nome || "Cliente removido"}
        </div>
        <div className="s">
          {numOS(o.numero)}{showDate && o.hora ? " · " + o.hora : ""} · {o.itens.map((i) => i.nome).join(", ") || "sem serviços"}{nomes ? " · " + nomes : ""}{temNf(o) ? " · " + rotuloNf(o.nf) : ""}
        </div>
      </div>
      <div className="r">
        <span className="num" style={{ fontWeight: 700 }}>{brl(o.total)}</span>
        <Pill st={o.status} />
      </div>
    </button>
  );
}

export function OSGrouped({ list, emptyTitle, emptyText }: { list: OS[]; emptyTitle: string; emptyText?: string }) {
  if (!list.length) return <div className="card"><Empty title={emptyTitle} text={emptyText} /></div>;
  const groups: Array<{ d: string; items: OS[] }> = [];
  for (const o of list) {
    const ult = groups[groups.length - 1];
    if (!ult || ult.d !== o.data) groups.push({ d: o.data, items: [o] });
    else ult.items.push(o);
  }
  return (
    <div className="card list">
      {groups.map((g) => (
        <Fragment key={g.d}>
          <div className="day-h">{relDia(g.d)} · {fmtDC(g.d)}</div>
          {g.items.map((o) => <OSRow key={o.id} o={o} showDate={false} />)}
        </Fragment>
      ))}
    </div>
  );
}
