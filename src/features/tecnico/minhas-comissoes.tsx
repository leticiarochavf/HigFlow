"use client";

import { useState } from "react";
import { Empty, MonthNav } from "@/components/ui";
import { useData } from "@/features/data/data-provider";
import { comissaoDe } from "@/features/data/derived";
import { brl, fmtDC, mk, numOS, today } from "@/lib/format";

export function MinhasComissoes() {
  const { d, data, role } = useData();
  const [m, setM] = useState(mk(today()));
  if (role.r !== "func") return null;
  const f = role.f;

  const os = d.os.filter((o) => o.status === "concluida" && mk(o.data) === m && o.funcionarioIds.includes(f.id));
  const tot = os.reduce((a, o) => a + comissaoDe(o, f), 0);
  const pago = data.comissoes.find((c) => c.funcionarioId === f.id && c.mes === m);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Minhas comissões</h1>
          <div className="sub">
            {!f.comissaoValor ? "Sem comissão cadastrada" : f.comissaoTipo === "fixo" ? brl(f.comissaoValor) + " por OS concluída" : f.comissaoValor + "% do valor de cada OS concluída"}
          </div>
        </div>
        <MonthNav m={m} set={setM} />
      </div>
      <div className="kpis">
        <div className="card kpi hl"><span className="lbl">Total do mês</span><span className="v">{brl(tot)}</span><span className="d">{pago ? "Pago em " + fmtDC(pago.pagoEm) : "A receber"}</span></div>
        <div className="card kpi"><span className="lbl">Serviços</span><span className="v">{os.length}</span><span className="d">OS concluídas</span></div>
      </div>
      {os.length ? (
        <div className="card tbl-wrap">
          <table>
            <thead><tr><th>Data</th><th>Cliente</th><th className="n">OS</th><th className="n">Comissão</th></tr></thead>
            <tbody>
              {os.map((o) => (
                <tr key={o.id}>
                  <td>{fmtDC(o.data)}</td>
                  <td>{d.cli[o.clienteId]?.nome || "—"}</td>
                  <td className="n">{numOS(o.numero)}</td>
                  <td className="n"><b>{brl(comissaoDe(o, f))}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card"><Empty title="Nenhum serviço concluído neste mês" /></div>
      )}
    </>
  );
}
