"use client";

import { useState, type ReactNode } from "react";
import { useData } from "@/features/data/data-provider";
import { comissaoDe } from "@/features/data/derived";
import { FORMAS, MES, brl, brlK, durOS, fmtMes, mk, parseYmd, pct, shiftMes, today } from "@/lib/format";
import { CAT_COLORS, FUNNEL_COLORS } from "@/lib/format-chart";
import { Columns, HBars, type BarRow } from "./charts";

const DIAS_SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const DIAS_LONGOS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

export function DashboardPage() {
  const { d, data } = useData();
  const t = today();
  const [n, setN] = useState(6);

  const mAtual = mk(t);
  const meses = [...Array(n)].map((_, i) => shiftMes(mAtual, i - n + 1));
  const m0 = meses[0];
  const mesesAnt = [...Array(n)].map((_, i) => shiftMes(m0, i - n));
  const noPer = (k: string, ms: string[]) => k >= ms[0] && k <= ms[ms.length - 1];

  const concl = d.os.filter((o) => o.status === "concluida");
  const cp = concl.filter((o) => noPer(mk(o.data), meses));
  const ca = concl.filter((o) => noPer(mk(o.data), mesesAnt));
  const soma = (os: typeof cp) => os.reduce((a, o) => a + (o.total || 0), 0);
  const fat = soma(cp), fatA = soma(ca);
  const rec = soma(cp.filter((o) => o.pagamento.status === "pago"));
  const ticket = cp.length ? fat / cp.length : 0;
  const ticketA = ca.length ? fatA / ca.length : 0;
  const clientes = new Set(cp.map((o) => o.clienteId)).size;

  const primeira: Record<string, string> = {};
  for (const o of concl) if (!primeira[o.clienteId] || o.data < primeira[o.clienteId]) primeira[o.clienteId] = o.data;
  const novos = Object.values(primeira).filter((x) => noPer(mk(x), meses)).length;
  const desp = data.despesas.filter((x) => noPer(mk(x.data), meses)).reduce((a, x) => a + (x.valor || 0), 0);
  const com = cp.reduce((a, o) => a + o.funcionarioIds.reduce((b, id) => b + comissaoDe(o, d.func[id]), 0), 0);

  const delta = (a: number, b: number): ReactNode => {
    if (!b) return <span className="delta">sem período anterior para comparar</span>;
    const p = Math.round(((a - b) / Math.abs(b)) * 100);
    return <span className="delta"><b>{p > 0 ? "▲ +" : p < 0 ? "▼ " : ""}{p}%</b> vs {n} meses anteriores</span>;
  };

  // séries
  const porMes = meses.map((k) => {
    const os = cp.filter((o) => mk(o.data) === k);
    const v = soma(os);
    return {
      k, v, label: MES[+k.slice(5) - 1], cur: k === mAtual, title: fmtMes(k),
      extra: [{ l: "OS concluídas", v: String(os.length) }, { l: "Ticket médio", v: brl(os.length ? v / os.length : 0) }],
    };
  });

  const serv: Record<string, { v: number; q: number; os: number }> = {};
  for (const o of cp) {
    for (const it of o.itens) {
      const x = (serv[it.nome] ||= { v: 0, q: 0, os: 0 });
      x.v += (Number(it.qtd) || 0) * (Number(it.preco) || 0);
      x.q += Number(it.qtd) || 0;
      x.os++;
    }
  }
  const servRows: BarRow[] = Object.entries(serv).sort((a, b) => b[1].v - a[1].v).slice(0, 6).map(([label, x]) => ({
    label, v: x.v, sub: `${x.os} OS`,
    extra: [{ l: "Quantidade", v: x.q.toLocaleString("pt-BR") }, { l: "Participação", v: pct(x.v, fat) + "%" }],
  }));

  const tec: Record<string, { v: number; os: number; h: number }> = {};
  for (const o of cp) {
    for (const id of o.funcionarioIds) {
      const x = (tec[id] ||= { v: 0, os: 0, h: 0 });
      x.v += (o.total || 0) / (o.funcionarioIds.length || 1);
      x.os++;
      x.h += durOS(o) / 60;
    }
  }
  const tecRows: BarRow[] = Object.entries(tec).filter(([id]) => d.func[id]).sort((a, b) => b[1].v - a[1].v).map(([id, x]) => ({
    label: d.func[id].nome, v: x.v, sub: `${x.os} OS`,
    extra: [
      { l: "Horas em serviço", v: x.h.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " h" },
      { l: "Comissão", v: brl(cp.filter((o) => o.funcionarioIds.includes(id)).reduce((a, o) => a + comissaoDe(o, d.func[id]), 0)) },
    ],
  }));

  const semanas = Math.max(1, Math.round((parseYmd(t).getTime() - parseYmd(m0 + "-01").getTime()) / (7 * 864e5)));
  const ativas = d.os.filter((o) => o.status !== "cancelada" && noPer(mk(o.data), meses));
  const porDia = DIAS_SEMANA.map((lab, i) => {
    const os = ativas.filter((o) => (parseYmd(o.data).getDay() + 6) % 7 === i);
    const hrs = os.reduce((a, o) => a + durOS(o) / 60, 0);
    return { k: lab, label: lab, v: hrs / semanas, title: DIAS_LONGOS[i], extra: [{ l: "OS no período", v: String(os.length) }] };
  });

  const formas: Record<string, number> = {};
  for (const o of cp) if (o.pagamento.status === "pago") formas[o.pagamento.forma || "outro"] = (formas[o.pagamento.forma || "outro"] || 0) + (o.total || 0);
  const fEnt = Object.entries(formas).sort((a, b) => b[1] - a[1]);
  const fTot = fEnt.reduce((a, x) => a + x[1], 0);

  const aRec = concl.filter((o) => o.pagamento.status !== "pago");
  const idade = (o: (typeof aRec)[number]) => Math.round((parseYmd(t).getTime() - parseYmd(o.data).getTime()) / 864e5);
  const aging: BarRow[] = ([
    ["Até 7 dias", (o) => idade(o) <= 7],
    ["8 a 30 dias", (o) => idade(o) > 7 && idade(o) <= 30],
    ["Mais de 30 dias", (o) => idade(o) > 30],
  ] as Array<[string, (o: (typeof aRec)[number]) => boolean]>).map(([label, fn]) => {
    const os = aRec.filter(fn);
    return { label, v: soma(os), sub: `${os.length} OS` };
  });

  const ret = d.retornos.filter((r) => noPer(mk(r.due), meses) && r.due <= t);
  const funil: Array<[string, number]> = [
    ["Retornos que venceram", ret.length],
    ["Contatados", ret.filter((r) => r.status === "contatado" || r.status === "agendado").length],
    ["Agendados de novo", ret.filter((r) => r.status === "agendado").length],
  ];
  const vazio = !concl.length;
  const resultado = fat - desp - com;

  return (
    <>
      <div className="topbar">
        <div><h1>Indicadores</h1><div className="sub">{fmtMes(m0)} a {fmtMes(mAtual)} · OS concluídas</div></div>
        <div className="chips">
          {[3, 6, 12].map((x) => <button key={x} className="chip" aria-pressed={n === x} onClick={() => setN(x)}>{x} meses</button>)}
        </div>
      </div>

      {vazio && <div className="banner"><div className="main"><b>Ainda sem OS concluídas</b>Os gráficos se preenchem conforme as OS forem concluídas.</div></div>}

      <div className="kpis">
        <div className="card kpi hl"><span className="lbl">Faturamento</span><span className="v">{brl(fat)}</span>{delta(fat, fatA)}</div>
        <div className="card kpi"><span className="lbl">Ticket médio</span><span className="v">{brl(ticket)}</span>{delta(ticket, ticketA)}</div>
        <div className="card kpi"><span className="lbl">OS concluídas</span><span className="v">{cp.length}</span>{delta(cp.length, ca.length)}</div>
        <div className="card kpi"><span className="lbl">Resultado</span><span className="v">{brl(resultado)}</span><span className="delta">margem <b>{pct(resultado, fat)}%</b> · {pct(rec, fat)}% já recebido</span></div>
      </div>

      <div className="dash-grid">
        <section className="card chart-card wide">
          <h2>Faturamento por mês</h2>
          <p className="cap">Soma das OS concluídas em cada mês. Passe o mouse para ver quantidade e ticket.</p>
          <Columns data={porMes} label="Faturamento" />
          <details className="dt">
            <summary>Ver tabela</summary>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Mês</th><th className="n">OS</th><th className="n">Faturamento</th></tr></thead>
                <tbody>
                  {porMes.map((m) => (
                    <tr key={m.k}><td style={{ textTransform: "capitalize" }}>{m.title}</td><td className="n">{m.extra[0].v}</td><td className="n">{brl(m.v)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <section className="card chart-card"><h2>Receita por serviço</h2><p className="cap">Os 6 serviços que mais faturaram no período.</p><HBars rows={servRows} empty="Sem serviços concluídos no período." /></section>
        <section className="card chart-card"><h2>Receita por técnico</h2><p className="cap">Valor da OS dividido entre a equipe escalada.</p><HBars rows={tecRows} color="#2a78d6" empty="Nenhuma OS com equipe no período." /></section>

        <section className="card chart-card">
          <h2>Ocupação por dia da semana</h2>
          <p className="cap">Horas de serviço agendadas, média por semana.</p>
          <Columns
            data={porDia} color="#2a78d6" h={200} label="Horas por semana"
            fmt={(v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " h"}
            fmtAxis={(v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "h"}
          />
        </section>

        <section className="card chart-card">
          <h2>Como os clientes pagam</h2>
          <p className="cap">{fTot ? brl(fTot) + " recebidos no período" : "Nenhum pagamento no período."}</p>
          {fTot > 0 && (
            <>
              <div className="seg" role="img" aria-label="Divisão do recebido por forma de pagamento">
                {fEnt.map(([k, v], i) => <span key={k} title={`${FORMAS[k] || k}: ${brl(v)}`} style={{ flex: `${v} 0 0`, background: CAT_COLORS[i % 6] }} />)}
              </div>
              <div className="lg">
                {fEnt.map(([k, v], i) => (
                  <div key={k}><i style={{ background: CAT_COLORS[i % 6] }} />{FORMAS[k] || k}<b>{brlK(v)}</b><em>{pct(v, fTot)}%</em></div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card chart-card">
          <h2>A receber por tempo de atraso</h2>
          <p className="cap">{aRec.length ? `${brl(soma(aRec))} em ${aRec.length} OS concluídas sem pagamento` : "Nada a receber."}</p>
          {aRec.length > 0 && <HBars rows={aging} color="#eb6834" />}
        </section>

        <section className="card chart-card">
          <h2>Clientes e retornos</h2>
          <p className="cap">Clientes atendidos no período e o que aconteceu com quem chegou na data de retorno.</p>
          <div className="kv" style={{ fontSize: ".92rem", marginBottom: 6 }}>
            <dt>Clientes atendidos</dt><dd className="num"><b>{clientes}</b></dd>
            <dt>Clientes novos</dt><dd className="num"><b>{novos}</b> <span className="muted">(primeira OS no período)</span></dd>
            <dt>Voltaram</dt><dd className="num"><b>{Math.max(0, clientes - novos)}</b></dd>
            <dt>OS por cliente</dt><dd className="num"><b>{clientes ? (cp.length / clientes).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "0"}</b></dd>
          </div>
          {ret.length ? (
            <div className="hb">
              {funil.map(([l, v], i) => (
                <div className="hb-row" key={l}>
                  <span className="l">{l}</span>
                  <span className="n">{v}{i > 0 && <> <small className="muted" style={{ fontWeight: 500 }}>({pct(v, funil[0][1])}%)</small></>}</span>
                  <div className="track"><span style={{ width: `${Math.max(1, (v / (funil[0][1] || 1)) * 100)}%`, background: FUNNEL_COLORS[i] }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <span className="muted small">Nenhum retorno venceu no período.</span>
          )}
        </section>
      </div>
    </>
  );
}
