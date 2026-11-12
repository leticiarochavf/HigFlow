"use client";

import { I } from "@/components/icons";
import { Confirm, Empty, Sheet, WaBtn } from "@/components/ui";
import { deleteCliente } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import { OSRow } from "@/features/os/os-row";
import { useUI } from "@/features/ui/ui-provider";
import { EMPRESA, RSTATUS, brl, endTxt, firstName, fmtDC, mapsLink } from "@/lib/format";

export function ClienteView({ id }: { id: string }) {
  const { d } = useData();
  const { run, openM, closeM } = useUI();
  const c = d.cli[id];
  if (!c) return <Sheet title="Cliente"><Empty title="Cliente excluído" /></Sheet>;

  const hist = d.os.filter((o) => o.clienteId === id).reverse();
  const tot = hist.filter((o) => o.status === "concluida").reduce((a, o) => a + (o.total || 0), 0);
  const rets = d.retornos.filter((r) => r.clienteId === id);

  return (
    <Sheet
      title={c.nome}
      footer={
        <>
          <button className="btn" onClick={() => openM("cliForm", { c })}>{I.edit} Editar</button>
          <button className="btn pri" onClick={() => openM("osForm", { preset: { clienteId: id } })}>{I.plus} Nova OS</button>
        </>
      }
    >
      <dl className="kv">
        <dt>Telefone</dt><dd>{c.telefone || "—"}</dd>
        <dt>Endereço</dt><dd>{endTxt(c) || "—"}</dd>
        {c.obs && <><dt>Obs.</dt><dd style={{ whiteSpace: "pre-wrap" }}>{c.obs}</dd></>}
        <dt>Total gasto</dt><dd className="num"><b>{brl(tot)}</b></dd>
      </dl>
      <div className="acts">
        <WaBtn tel={c.telefone} msg={`Olá ${firstName(c.nome)}! Aqui é da ${EMPRESA}.`} sm />
        {mapsLink(c) && <a className="btn sm" href={mapsLink(c)!} target="_blank" rel="noopener noreferrer">{I.pin} Ver no mapa</a>}
      </div>
      {rets.length > 0 && (
        <div className="sec">
          <h3>Próximos retornos</h3>
          <div className="card list">
            {rets.map((r) => (
              <div className="row" style={{ cursor: "default" }} key={r.id}>
                <div className="main">
                  <div className="t">{r.servico}</div>
                  <div className="s">a cada {r.meses} meses · último em {fmtDC(r.base)}</div>
                </div>
                <div className="r"><span className="small num">{fmtDC(r.due)}</span><span className="tag">{RSTATUS[r.status]}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="sec">
        <h3>Histórico ({hist.length})</h3>
        {hist.length ? (
          <div className="card list">{hist.map((o) => <OSRow key={o.id} o={o} />)}</div>
        ) : (
          <div className="card"><Empty title="Sem serviços ainda" /></div>
        )}
      </div>
      {!hist.length && (
        <div><Confirm ask="Excluir este cliente?" onYes={() => run(() => deleteCliente(id), "Cliente excluído").then(closeM)} /></div>
      )}
    </Sheet>
  );
}
