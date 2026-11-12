"use client";

import { useState } from "react";
import { I } from "@/components/icons";
import { Empty, MonthNav } from "@/components/ui";
import { pagarComissao } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import { comissaoDe } from "@/features/data/derived";
import { OSRow } from "@/features/os/os-row";
import { useUI } from "@/features/ui/ui-provider";
import { FORMAS, MESL, brl, fmtDC, mk, shiftMes, today } from "@/lib/format";
import { Bars } from "./bars";

export function FinanceiroPage() {
  const { d, data } = useData();
  const { run, openM } = useUI();
  const [m, setM] = useState(mk(today()));

  const concl = d.os.filter((o) => o.status === "concluida");
  const doMes = concl.filter((o) => mk(o.data) === m);
  const fat = doMes.reduce((a, o) => a + (o.total || 0), 0);
  const rec = d.os.filter((o) => o.pagamento.status === "pago" && mk(o.pagamento.pagoEm) === m).reduce((a, o) => a + (o.total || 0), 0);
  const aRec = concl.filter((o) => o.pagamento.status !== "pago").sort((a, b) => a.data.localeCompare(b.data));
  const desp = data.despesas.filter((x) => mk(x.data) === m).sort((a, b) => b.data.localeCompare(a.data));
  const despT = desp.reduce((a, x) => a + (x.valor || 0), 0);

  const com = data.funcionarios
    .map((f) => {
      const os = doMes.filter((o) => o.funcionarioIds.includes(f.id));
      return { f, n: os.length, v: os.reduce((a, o) => a + comissaoDe(o, f), 0), pago: data.comissoes.find((c) => c.funcionarioId === f.id && c.mes === m) };
    })
    .filter((x) => x.n > 0);
  const comT = com.reduce((a, x) => a + x.v, 0);
  const res = fat - despT - comT;

  const meses = [...Array(6)].map((_, i) => shiftMes(m, i - 5));
  const serie = meses.map((k) => {
    const f = concl.filter((o) => mk(o.data) === k);
    const fa = f.reduce((a, o) => a + (o.total || 0), 0);
    const de = data.despesas.filter((x) => mk(x.data) === k).reduce((a, x) => a + (x.valor || 0), 0);
    const co = f.reduce((a, o) => a + o.funcionarioIds.reduce((b, id) => b + comissaoDe(o, d.func[id]), 0), 0);
    return { k, fa, sa: de + co };
  });

  const tops: Record<string, { n: number; v: number }> = {};
  for (const o of doMes) {
    for (const it of o.itens) {
      const t = (tops[it.nome] ||= { n: 0, v: 0 });
      t.n += Number(it.qtd) || 0;
      t.v += (Number(it.qtd) || 0) * (Number(it.preco) || 0);
    }
  }
  const top = Object.entries(tops).sort((a, b) => b[1].v - a[1].v).slice(0, 6);
  const topMax = top[0]?.[1].v || 1;

  const formas: Record<string, number> = {};
  for (const o of d.os) {
    if (o.pagamento.status === "pago" && mk(o.pagamento.pagoEm) === m) formas[o.pagamento.forma] = (formas[o.pagamento.forma] || 0) + (o.total || 0);
  }

  return (
    <>
      <div className="topbar">
        <div><h1>Financeiro</h1><div className="sub">Relatório mensal, despesas e comissões</div></div>
        <MonthNav m={m} set={setM} />
      </div>

      <div className="kpis">
        <div className="card kpi hl"><span className="lbl">Resultado do mês</span><span className="v">{brl(res)}</span><span className="d">faturado − despesas − comissões</span></div>
        <div className="card kpi"><span className="lbl">Faturado</span><span className="v">{brl(fat)}</span><span className="d">{doMes.length} OS concluídas · ticket {brl(doMes.length ? fat / doMes.length : 0)}</span></div>
        <div className="card kpi"><span className="lbl">Recebido</span><span className="v">{brl(rec)}</span><span className="d">entrou no caixa no mês</span></div>
        <div className="card kpi"><span className="lbl">Despesas + comissões</span><span className="v">{brl(despT + comT)}</span><span className="d">{brl(despT)} + {brl(comT)}</span></div>
      </div>

      <div className="grid2">
        <section className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="sec-h">
            <h2>Últimos 6 meses</h2>
            <div className="legend">
              <span><i style={{ background: "var(--green)" }} />Faturado</span>
              <span><i style={{ background: "var(--sky-ink)", opacity: 0.55 }} />Saídas</span>
            </div>
          </div>
          <Bars serie={serie} atual={m} />
        </section>
        <section className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2>Serviços que mais faturaram</h2>
          {top.length ? (
            top.map(([n, v]) => (
              <div className="hbar" key={n}>
                <span className="small" style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n} <span className="muted">· {v.n}</span></span>
                <span className="small num" style={{ fontWeight: 700 }}>{brl(v.v)}</span>
                <div className="bar"><span style={{ width: Math.max(3, (v.v / topMax) * 100) + "%" }} /></div>
              </div>
            ))
          ) : (
            <span className="muted small">Sem OS concluídas neste mês.</span>
          )}
          {Object.keys(formas).length > 0 && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="lbl">Recebido por forma</span>
              {Object.entries(formas).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div className="sec-h small" key={k}><span>{FORMAS[k] || k}</span><b className="num">{brl(v)}</b></div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="sec">
        <div className="sec-h"><h2>Comissões de {MESL[+m.slice(5) - 1]}</h2></div>
        {com.length ? (
          <div className="card tbl-wrap">
            <table>
              <thead><tr><th>Funcionário</th><th>Regra</th><th className="n">OS</th><th className="n">Comissão</th><th /></tr></thead>
              <tbody>
                {com.map((x) => (
                  <tr key={x.f.id}>
                    <td>{x.f.nome}</td>
                    <td className="small muted">{!x.f.comissaoValor ? "sem comissão" : x.f.comissaoTipo === "fixo" ? brl(x.f.comissaoValor) + " por OS" : x.f.comissaoValor + "% da OS"}</td>
                    <td className="n">{x.n}</td>
                    <td className="n"><b>{brl(x.v)}</b></td>
                    <td className="n">
                      {x.pago ? (
                        <span className="pill pg-pago">Pago {fmtDC(x.pago.pagoEm)}</span>
                      ) : x.v > 0 ? (
                        <button className="btn sm" onClick={() => run(() => pagarComissao(x.f.id, m, x.v), "Comissão marcada como paga")}>Marcar pago</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card"><Empty title="Sem comissões no mês" text="Comissões são calculadas sobre OS concluídas com a equipe marcada." /></div>
        )}
      </section>

      <div className="grid2">
        <section className="sec">
          <div className="sec-h"><h2>Despesas do mês</h2><button className="btn sm pri" onClick={() => openM("despForm", { m })}>{I.plus} Despesa</button></div>
          {desp.length ? (
            <div className="card list">
              {desp.map((x) => (
                <button key={x.id} className="row" onClick={() => openM("despForm", { x })}>
                  <div className="main"><div className="t">{x.descricao}</div><div className="s">{x.categoria} · {fmtDC(x.data)}</div></div>
                  <div className="r"><span className="num" style={{ fontWeight: 700 }}>{brl(x.valor)}</span></div>
                </button>
              ))}
            </div>
          ) : (
            <div className="card"><Empty title="Nenhuma despesa lançada" text="Lance produtos, combustível, manutenção e outras saídas." /></div>
          )}
        </section>
        <section className="sec">
          <div className="sec-h"><h2>Contas a receber</h2><span className="num" style={{ fontWeight: 700 }}>{brl(aRec.reduce((a, o) => a + (o.total || 0), 0))}</span></div>
          {aRec.length ? (
            <div className="card list">{aRec.map((o) => <OSRow key={o.id} o={o} />)}</div>
          ) : (
            <div className="card"><Empty title="Tudo recebido" text="Nenhum serviço concluído aguardando pagamento." /></div>
          )}
        </section>
      </div>
    </>
  );
}
