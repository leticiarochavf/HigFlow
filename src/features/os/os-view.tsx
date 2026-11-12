"use client";

import { useState } from "react";
import { I } from "@/components/icons";
import { Confirm, Empty, Field, FormasOptions, PgPill, Pill, Sheet, Swatches, WaBtn } from "@/components/ui";
import { deleteOS, patchOS } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import {
  EMPRESA, FORMAS, UNID, brl, corOS, destino, durOS, endTxt, firstName, fmtData, fmtDC, fmtHm, hm, isUrl, mapsLink,
  numOS, relDia, rotaLink, rotuloNf, temNf, today,
} from "@/lib/format";
import type { StatusOS } from "@/types/domain";
import { NfBox } from "./nf-box";
import { Notas } from "./notas";

export function OSView({ id }: { id: string }) {
  const { data, d, role } = useData();
  const { run, closeM, openM } = useUI();
  const o = data.os.find((x) => x.id === id);
  const [forma, setForma] = useState(o?.pagamento.forma || "pix");

  if (!o) return <Sheet title="OS"><Empty title="Esta OS foi excluída" /></Sheet>;
  const c = d.cli[o.clienteId];
  const isAdmin = role.r === "admin";

  const setStatus = (s: StatusOS) =>
    run(
      () => patchOS(o.id, { status: s, ...(s === "concluida" ? { concluidaEm: today() } : {}) }),
      s === "concluida" ? "OS concluída" : s === "em_andamento" ? "Serviço iniciado" : "Status atualizado",
    );
  const pagar = () => run(() => patchOS(o.id, { pagamento: { forma, status: "pago", pagoEm: today() } }), "Pagamento registrado");
  const desfazerPg = () => run(() => patchOS(o.id, { pagamento: { status: "pendente", pagoEm: null } }), "Pagamento desfeito");

  const msg = `Olá ${firstName(c?.nome)}! Aqui é da ${EMPRESA}. Confirmando sua ${o.itens.map((i) => i.nome.toLowerCase()).join(", ")} ${
    relDia(o.data).toLowerCase() === "hoje" ? "hoje" : "em " + fmtDC(o.data)
  }${o.hora ? " às " + o.hora : ""}.`;

  const footer = (
    <>
      {o.status === "agendada" && <button className="btn" onClick={() => setStatus("em_andamento")}>{I.play} Iniciar</button>}
      {(o.status === "agendada" || o.status === "em_andamento") && <button className="btn pri" onClick={() => setStatus("concluida")}>{I.check} Concluir serviço</button>}
      {isAdmin && (o.status === "concluida" || o.status === "cancelada") && <button className="btn" onClick={() => setStatus("agendada")}>Reabrir</button>}
      {isAdmin && <button className="btn" onClick={() => openM("osForm", { os: o })}>{I.edit} Editar</button>}
    </>
  );

  return (
    <Sheet title={numOS(o.numero)} footer={footer}>
      <div className="acts">
        <Pill st={o.status} />
        <PgPill p={o.pagamento} />
        {o.contratoId && <span className="tag">Contrato recorrente</span>}
        {temNf(o) && <span className="tag">{rotuloNf(o.nf)}</span>}
      </div>

      <div className="card" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div className="lbl">Cliente</div>
          <h3 style={{ fontSize: "1.1rem" }}>{c?.nome || "Cliente removido"}</h3>
          <div className="small muted">{c?.telefone || "sem telefone"}{endTxt(c) ? " · " + endTxt(c) : ""}</div>
        </div>
        <div className="acts">
          {rotaLink(c) && <a className="btn sm pri" href={rotaLink(c)!} target="_blank" rel="noopener noreferrer">{I.pin} Rota no Maps</a>}
          {mapsLink(c) && <a className="btn sm" href={mapsLink(c)!} target="_blank" rel="noopener noreferrer">Ver local</a>}
          <WaBtn tel={c?.telefone} msg={msg} sm />
        </div>
        {!destino(c) && !isUrl(c?.mapsUrl) && <span className="hint">Sem endereço ou link do Maps neste cliente.</span>}
      </div>

      <dl className="kv">
        <dt>Data</dt>
        <dd>{fmtData(o.data)} {o.hora ? `das ${o.hora} às ${fmtHm(hm(o.hora)! + durOS(o))}` : ""}</dd>
        <dt>Equipe</dt>
        <dd>{o.funcionarioIds.map((i) => d.func[i]?.nome).filter(Boolean).join(", ") || "—"}</dd>
        {o.obs && <><dt>Obs.</dt><dd style={{ whiteSpace: "pre-wrap" }}>{o.obs}</dd></>}
        {o.concluidaEm && <><dt>Concluída</dt><dd>{fmtDC(o.concluidaEm)}</dd></>}
      </dl>

      <div className="tbl-wrap card">
        <table>
          <thead><tr><th>Serviço</th><th className="n">Qtd</th><th className="n">Valor</th></tr></thead>
          <tbody>
            {o.itens.map((it, i) => (
              <tr key={i}>
                <td>{it.nome}</td>
                <td className="n">{it.qtd} {UNID[it.unidade] && it.unidade !== "un" ? UNID[it.unidade] : ""}</td>
                <td className="n">{brl((Number(it.qtd) || 0) * (Number(it.preco) || 0))}</td>
              </tr>
            ))}
            {o.desconto > 0 && <tr><td>Desconto</td><td /><td className="n">− {brl(o.desconto)}</td></tr>}
            <tr><td><b>Total</b></td><td /><td className="n"><b>{brl(o.total)}</b></td></tr>
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="fset">
          <span className="lbl">Cor na agenda</span>
          <Swatches id="ov-cor" value={corOS(o, d.serv)} set={(k) => run(() => patchOS(o.id, { cor: k }))} />
        </div>
      )}

      <Notas os={o} />

      {o.status !== "cancelada" && <NfBox os={o} isAdmin={isAdmin} />}

      {o.status !== "cancelada" && (
        <div className="fset">
          <span className="lbl">Pagamento</span>
          {o.pagamento.status === "pago" ? (
            <div className="acts" style={{ alignItems: "center", justifyContent: "space-between" }}>
              <span><b>{FORMAS[o.pagamento.forma] || "—"}</b> · recebido em {fmtDC(o.pagamento.pagoEm)}</span>
              {isAdmin && <button className="btn sm ghost" onClick={desfazerPg}>Desfazer</button>}
            </div>
          ) : (
            <div className="fr" style={{ alignItems: "end" }}>
              <Field label="Forma">
                <select id="pg-forma" value={forma} onChange={(e) => setForma(e.target.value)}><FormasOptions /></select>
              </Field>
              <button className="btn pri" onClick={pagar}>{I.coin} Registrar pagamento</button>
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="acts" style={{ justifyContent: "space-between" }}>
          {o.status !== "cancelada" ? <button className="btn sm" onClick={() => setStatus("cancelada")}>Cancelar OS</button> : <span />}
          <Confirm ask="Excluir esta OS?" onYes={() => run(() => deleteOS(o.id), "OS excluída").then(closeM)} />
        </div>
      )}
    </Sheet>
  );
}
