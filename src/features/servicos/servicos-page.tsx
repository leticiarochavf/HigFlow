"use client";

import { useState } from "react";
import { I } from "@/components/icons";
import { Empty } from "@/components/ui";
import { seedServicos } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import { BASE_SERVICOS, UNID, corDe } from "@/lib/format";

export function ServicosPage() {
  const { data } = useData();
  const { openM, run } = useUI();
  const [busy, setBusy] = useState(false);
  const list = [...data.servicos].sort((a, b) => Number(!a.ativo) - Number(!b.ativo) || a.nome.localeCompare(b.nome));

  async function criarBase() {
    setBusy(true);
    try {
      await run(() => seedServicos(BASE_SERVICOS), "Lista base criada.");
    } catch {}
    setBusy(false);
  }

  return (
    <>
      <div className="topbar">
        <div><h1>Serviços</h1><div className="sub">Serviços que a empresa faz e o tempo de retorno</div></div>
        <button className="btn pri" onClick={() => openM("servForm")}>{I.plus} Novo serviço</button>
      </div>
      {list.length ? (
        <div className="card tbl-wrap">
          <table>
            <thead>
              <tr><th>Serviço</th><th>Cobrança</th><th className="n">Duração</th><th className="n">Retorno</th></tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => openM("servForm", { s })}>
                  <td>
                    <b><span className="dot" style={{ background: corDe(s.cor).bd }} />{s.nome}</b>
                    {!s.ativo && <> <span className="tag">Inativo</span></>}
                  </td>
                  <td className="muted">por {UNID[s.unidade] || s.unidade}</td>
                  <td className="n">{s.duracaoMin || 120} min</td>
                  <td className="n">{s.retornoMeses ? s.retornoMeses + " meses" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <Empty
            title="Catálogo vazio"
            text="Comece com a lista base de higienização (sofá, colchão, tapete, cortina, persiana e impermeabilização) e ajuste o tempo de retorno."
            action={<button className="btn pri" disabled={busy} onClick={criarBase}>{busy ? "Criando…" : "Criar lista base"}</button>}
          />
        </div>
      )}
    </>
  );
}
