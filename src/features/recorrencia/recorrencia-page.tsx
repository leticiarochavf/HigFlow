"use client";

import { useState } from "react";
import { I } from "@/components/icons";
import { Empty } from "@/components/ui";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import { FREQ, addDays, brl, fmtDC, today } from "@/lib/format";
import { RetornoList } from "./retorno-list";
import { useGerarContratos } from "./use-gerar-contratos";

export function RecorrenciaPage() {
  const { d, data } = useData();
  const { openM } = useUI();
  const { busy, gerar } = useGerarContratos();
  const t = today();
  const [tab, setTab] = useState<"retornos" | "contratos">("retornos");
  const [rf, setRf] = useState("pendentes");

  const rl =
    rf === "pendentes" ? d.retPend
    : rf === "contatados" ? d.retornos.filter((r) => r.status === "contatado")
    : d.retornos.filter((r) => r.status === "pendente" && r.due > addDays(t, 30));
  const contratos = [...data.contratos].sort((a, b) => Number(!a.ativo) - Number(!b.ativo) || a.proximaData.localeCompare(b.proximaData));
  const chip = <V extends string>(v: V, cur: string, set: (v: V) => void, l: string) => (
    <button className="chip" aria-pressed={cur === v} onClick={() => set(v)}>{l}</button>
  );

  return (
    <>
      <div className="topbar">
        <div><h1>Recorrência</h1><div className="sub">Retornos de clientes e contratos fixos</div></div>
        {tab === "contratos" && <button className="btn pri" onClick={() => openM("contratoForm")}>{I.plus} Novo contrato</button>}
      </div>
      <div className="chips">
        {chip("retornos", tab, setTab, `Retornos (${d.retPend.length})`)}
        {chip("contratos", tab, setTab, `Contratos (${data.contratos.filter((c) => c.ativo).length})`)}
      </div>

      {tab === "retornos" ? (
        <div className="sec">
          <p className="muted small" style={{ margin: 0 }}>
            Quando uma OS é concluída, cada serviço com &quot;lembrar após X meses&quot; gera um retorno. Ele aparece aqui 30 dias antes de vencer.
          </p>
          <div className="chips">
            {chip("pendentes", rf, setRf, "Para oferecer")}{chip("contatados", rf, setRf, "Contatados")}{chip("futuros", rf, setRf, "Mais adiante")}
          </div>
          <RetornoList list={rl} />
        </div>
      ) : (
        <div className="sec">
          {d.contratosDue.length > 0 && (
            <div className="banner">
              <div className="main"><b>{d.contratosDue.length} com visita nos próximos 7 dias</b>As OS ainda não foram geradas.</div>
              <button className="btn pri" disabled={busy} onClick={gerar}>{busy ? "Gerando…" : "Gerar OS"}</button>
            </div>
          )}
          {contratos.length ? (
            <div className="card list">
              {contratos.map((c) => (
                <button key={c.id} className="row" onClick={() => openM("contratoForm", { c })}>
                  <div className="main">
                    <div className="t">{d.cli[c.clienteId]?.nome || "Cliente removido"}</div>
                    <div className="s">{FREQ[c.frequencia]} · {c.itens.map((i) => i.nome).join(", ")}</div>
                  </div>
                  <div className="r">
                    <span className="num small" style={{ fontWeight: 700 }}>{brl(c.total)}</span>
                    {!c.ativo ? <span className="tag">Pausado</span> : <span className="small muted">próx. {fmtDC(c.proximaData)}</span>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="card">
              <Empty
                title="Nenhum contrato recorrente"
                text="Para empresas, condomínios ou clientes com visita fixa. O sistema gera as OS de cada visita."
                action={<button className="btn pri" onClick={() => openM("contratoForm")}>{I.plus} Novo contrato</button>}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
