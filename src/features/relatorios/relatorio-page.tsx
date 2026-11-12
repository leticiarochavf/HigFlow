"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { I } from "@/components/icons";
import { Empty } from "@/components/ui";
import { useData } from "@/features/data/data-provider";
import { baixarCsv } from "@/lib/csv";
import { EMPRESA, STATUS, UNID, endTxt, fmtDC, mk, numOS, rotuloNf, today, ymd } from "@/lib/format";
import type { OS } from "@/types/domain";

type Linha = { os: OS; nome: string; servicoId: string; qtd: number; unidade: string };

const STATUS_REL: Record<string, string> = {
  concluida: "Concluídas", abertas: "Abertas (agendadas e em andamento)", cancelada: "Canceladas", todas: "Todas",
};

const qtdFmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Relatório de OS por serviço: quantidade feita, clientes atendidos e lista das OS. Pronto para imprimir. */
export function RelatorioPage() {
  const { d, data } = useData();
  const params = useSearchParams();
  const t = today();
  const [servico, setServico] = useState(params.get("servico") || "");
  const [de, setDe] = useState(params.get("de") ?? mk(t) + "-01");
  const [ate, setAte] = useState(params.get("ate") ?? t);
  const [status, setStatus] = useState(params.get("status") || "concluida");

  const servicos = useMemo(() => [...data.servicos].sort((a, b) => a.nome.localeCompare(b.nome)), [data.servicos]);
  const servicoNome = servico ? servicos.find((s) => s.id === servico)?.nome || "Serviço removido" : "Todos os serviços";

  // OS dentro do período e do status; cada item de serviço vira uma linha do relatório
  const linhas = useMemo<Linha[]>(() => {
    const out: Linha[] = [];
    for (const o of d.os) {
      if (status === "concluida" && o.status !== "concluida") continue;
      if (status === "abertas" && o.status !== "agendada" && o.status !== "em_andamento") continue;
      if (status === "cancelada" && o.status !== "cancelada") continue;
      if (de && o.data < de) continue;
      if (ate && o.data > ate) continue;
      for (const it of o.itens) {
        if (servico && it.servicoId !== servico) continue;
        out.push({ os: o, nome: it.nome, servicoId: it.servicoId, qtd: Number(it.qtd) || 0, unidade: it.unidade });
      }
    }
    return out.sort((a, b) => a.os.data.localeCompare(b.os.data) || a.os.numero - b.os.numero);
  }, [d.os, status, de, ate, servico]);

  const totalOS = new Set(linhas.map((l) => l.os.id)).size;
  const totalQtd = linhas.reduce((a, l) => a + l.qtd, 0);
  const totalClientes = new Set(linhas.map((l) => l.os.clienteId)).size;

  const porServico = useMemo(() => {
    const m = new Map<string, { nome: string; unidade: string; os: Set<string>; clientes: Set<string>; qtd: number }>();
    for (const l of linhas) {
      const k = l.servicoId || l.nome;
      const x = m.get(k) ?? { nome: l.nome, unidade: l.unidade, os: new Set(), clientes: new Set(), qtd: 0 };
      x.os.add(l.os.id);
      x.clientes.add(l.os.clienteId);
      x.qtd += l.qtd;
      m.set(k, x);
    }
    return [...m.entries()].map(([k, x]) => ({ k, ...x })).sort((a, b) => b.qtd - a.qtd);
  }, [linhas]);

  const porCliente = useMemo(() => {
    const m = new Map<string, { os: Set<string>; qtd: number; ultima: string }>();
    for (const l of linhas) {
      const x = m.get(l.os.clienteId) ?? { os: new Set(), qtd: 0, ultima: "" };
      x.os.add(l.os.id);
      x.qtd += l.qtd;
      if (l.os.data > x.ultima) x.ultima = l.os.data;
      m.set(l.os.clienteId, x);
    }
    return [...m.entries()]
      .map(([id, x]) => ({ id, c: d.cli[id], ...x }))
      .sort((a, b) => b.qtd - a.qtd || (a.c?.nome || "").localeCompare(b.c?.nome || ""));
  }, [linhas, d.cli]);

  const periodo = de || ate ? `${de ? fmtDC(de) : "início"} a ${ate ? fmtDC(ate) : "hoje"}` : "todo o período";

  function atalho(tipo: "mes" | "passado" | "ano" | "tudo") {
    const y = +t.slice(0, 4), m = +t.slice(5, 7);
    if (tipo === "mes") { setDe(mk(t) + "-01"); setAte(t) }
    if (tipo === "passado") { setDe(ymd(new Date(y, m - 2, 1))); setAte(ymd(new Date(y, m - 1, 0))) }
    if (tipo === "ano") { setDe(`${y}-01-01`); setAte(t) }
    if (tipo === "tudo") { setDe(""); setAte("") }
  }

  function exportar() {
    baixarCsv(`relatorio-os-por-servico-${t}.csv`, [
      ["Data", "OS", "Status", "Cliente", "Telefone", "Endereço", "Serviço", "Quantidade", "Unidade", "Nota fiscal"],
      ...linhas.map((l) => {
        const c = d.cli[l.os.clienteId];
        return [fmtDC(l.os.data), numOS(l.os.numero), STATUS[l.os.status], c?.nome || "Cliente removido", c?.telefone || "", endTxt(c), l.nome, l.qtd, UNID[l.unidade] || l.unidade, rotuloNf(l.os.nf)];
      }),
    ]);
  }

  return (
    <>
      <div className="print-only">
        <h1>Relatório de OS por serviço</h1>
        <p style={{ margin: "4px 0 0" }}>{EMPRESA} · {servicoNome} · {periodo} · {STATUS_REL[status]}</p>
        <p style={{ margin: "2px 0 12px", fontSize: ".85rem" }}>Emitido em {fmtDC(t)}</p>
      </div>

      <div className="topbar no-print">
        <div><h1>Relatórios</h1><div className="sub">OS por serviço: quantidade feita e clientes atendidos</div></div>
        <div className="acts">
          <button className="btn" onClick={exportar} disabled={!linhas.length}>Exportar CSV</button>
          <button className="btn pri" onClick={() => window.print()} disabled={!linhas.length}>{I.os} Imprimir</button>
        </div>
      </div>

      <div className="card no-print" style={{ padding: 16 }}>
        <div className="f">
          <div className="fr">
            <label className="fl">Serviço
              <select id="rel-srv" value={servico} onChange={(e) => setServico(e.target.value)}>
                <option value="">Todos os serviços</option>
                {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </label>
            <label className="fl">De<input id="rel-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} /></label>
            <label className="fl">Até<input id="rel-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></label>
            <label className="fl">OS
              <select id="rel-st" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(STATUS_REL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>
          <div className="chips">
            <button className="chip" onClick={() => atalho("mes")}>Este mês</button>
            <button className="chip" onClick={() => atalho("passado")}>Mês passado</button>
            <button className="chip" onClick={() => atalho("ano")}>Este ano</button>
            <button className="chip" onClick={() => atalho("tudo")}>Todo o período</button>
          </div>
        </div>
      </div>

      <div className="kpis">
        <div className="card kpi hl"><span className="lbl">Serviços feitos</span><span className="v">{qtdFmt(totalQtd)}</span><span className="d">{servicoNome}</span></div>
        <div className="card kpi"><span className="lbl">OS</span><span className="v">{totalOS}</span><span className="d">{periodo}</span></div>
        <div className="card kpi"><span className="lbl">Clientes</span><span className="v">{totalClientes}</span><span className="d">atendidos no período</span></div>
      </div>

      {!linhas.length ? (
        <div className="card"><Empty title="Nenhuma OS encontrada" text="Mude o serviço, o período ou o status para ver o relatório." /></div>
      ) : (
        <>
          <section className="sec">
            <h2>Por serviço</h2>
            <div className="card tbl-wrap">
              <table>
                <thead><tr><th>Serviço</th><th className="n">OS</th><th className="n">Quantidade</th><th className="n">Clientes</th></tr></thead>
                <tbody>
                  {porServico.map((x) => (
                    <tr key={x.k}>
                      <td><b>{x.nome}</b></td>
                      <td className="n">{x.os.size}</td>
                      <td className="n">{qtdFmt(x.qtd)} <span className="muted small">{x.unidade !== "un" ? UNID[x.unidade] || "" : ""}</span></td>
                      <td className="n">{x.clientes.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="sec">
            <h2>Clientes ({porCliente.length})</h2>
            <div className="card tbl-wrap">
              <table>
                <thead><tr><th>Cliente</th><th>Telefone</th><th>Bairro</th><th className="n">OS</th><th className="n">Quantidade</th><th className="n">Última</th></tr></thead>
                <tbody>
                  {porCliente.map((x) => (
                    <tr key={x.id}>
                      <td><b>{x.c?.nome || "Cliente removido"}</b></td>
                      <td>{x.c?.telefone || "—"}</td>
                      <td>{x.c?.bairro || "—"}</td>
                      <td className="n">{x.os.size}</td>
                      <td className="n">{qtdFmt(x.qtd)}</td>
                      <td className="n">{fmtDC(x.ultima)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="sec">
            <h2>Ordens de serviço ({totalOS})</h2>
            <div className="card tbl-wrap">
              <table>
                <thead><tr><th>Data</th><th>OS</th><th>Cliente</th><th>Serviço</th><th className="n">Qtd</th><th>NF</th></tr></thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={l.os.id + "-" + i}>
                      <td>{fmtDC(l.os.data)}</td>
                      <td>{numOS(l.os.numero)}</td>
                      <td>{d.cli[l.os.clienteId]?.nome || "Cliente removido"}</td>
                      <td>{l.nome}</td>
                      <td className="n">{qtdFmt(l.qtd)}</td>
                      <td>{rotuloNf(l.os.nf) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
