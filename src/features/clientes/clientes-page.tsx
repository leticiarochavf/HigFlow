"use client";

import { useMemo, useState } from "react";
import { I } from "@/components/icons";
import { Empty } from "@/components/ui";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import { baixarCsv } from "@/lib/csv";
import { brl, digits, fmtDC, norm, today } from "@/lib/format";

export function ClientesPage() {
  const { d, data } = useData();
  const { openM } = useUI();
  const [q, setQ] = useState("");

  const stats = useMemo(() => {
    const m: Record<string, { n: number; ult: string; tot: number }> = {};
    for (const o of d.os) {
      if (o.status === "cancelada") continue;
      const s = (m[o.clienteId] ||= { n: 0, ult: "", tot: 0 });
      s.n++;
      if (o.status === "concluida") {
        s.tot += o.total || 0;
        if (o.data > s.ult) s.ult = o.data;
      }
    }
    return m;
  }, [d.os]);

  let list = [...data.clientes].sort((a, b) => a.nome.localeCompare(b.nome));
  if (q) {
    const n = norm(q), dq = digits(q);
    list = list.filter((c) => norm(c.nome).includes(n) || norm(c.bairro).includes(n) || (dq && digits(c.telefone).includes(dq)));
  }

  const total = data.clientes.length;
  const comTelefone = data.clientes.filter((c) => digits(c.telefone).length >= 10).length;
  const atendidos = Object.values(stats).filter((s) => s.ult).length;

  function exportar() {
    baixarCsv(`clientes-lavcri-${today()}.csv`, [
      ["Nome", "Telefone", "Endereço", "Bairro", "Cidade", "Link do Maps", "Observações"],
      ...list.map((c) => [c.nome, c.telefone, c.endereco, c.bairro, c.cidade, c.mapsUrl, c.obs]),
    ]);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Clientes</h1>
          <div className="sub">{list.length === total ? `${total} cadastrados` : `${list.length} de ${total} cadastrados`}</div>
        </div>
        <div className="acts">
          <button className="btn" onClick={exportar} disabled={!list.length}>Exportar CSV{q ? ` (${list.length})` : ""}</button>
          <button className="btn pri" onClick={() => openM("cliForm")}>{I.plus} Novo cliente</button>
        </div>
      </div>
      <div className="kpis">
        <div className="card kpi hl"><span className="lbl">Clientes</span><span className="v">{total}</span><span className="d">cadastrados</span></div>
        <div className="card kpi"><span className="lbl">Atendidos</span><span className="v">{atendidos}</span><span className="d">com OS concluída</span></div>
        <div className="card kpi"><span className="lbl">Com telefone</span><span className="v">{comTelefone}</span><span className="d">dá para chamar no WhatsApp</span></div>
      </div>
      <div className="toolbar">
        <div className="search">
          {I.search}
          <input id="cli-q" type="search" placeholder="Buscar por nome, bairro ou telefone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {list.length ? (
        <div className="card list">
          {list.map((c) => {
            const s = stats[c.id];
            return (
              <button key={c.id} className="row" onClick={() => openM("cliView", { id: c.id })}>
                <div className="main">
                  <div className="t">{c.nome}</div>
                  <div className="s">{[c.bairro, c.telefone].filter(Boolean).join(" · ") || "sem contato"}</div>
                </div>
                <div className="r">
                  <span className="num small" style={{ fontWeight: 700 }}>{s ? brl(s.tot) : "—"}</span>
                  <span className="small muted">{s?.ult ? "último " + fmtDC(s.ult) : s ? s.n + " OS" : "sem serviços"}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <Empty title={q ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"} text={q ? "Tente outro termo." : "Cadastre o primeiro cliente ou crie direto pela Nova OS."} />
        </div>
      )}
    </>
  );
}
