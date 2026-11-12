"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { I } from "@/components/icons";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import { addDays, mk, norm, temNf, today, ymd } from "@/lib/format";
import { DayAgenda } from "./day-agenda";
import { OSGrouped } from "./os-row";

export function OSPage() {
  const { d, data } = useData();
  const { openM } = useUI();
  const t = today();
  const [vw, setVw] = useState<"agenda" | "lista">("agenda");
  const [day, setDay] = useState(t);
  const [tec, setTec] = useState("");
  const [st, setSt] = useState("abertas");
  const [per, setPer] = useState("futuro");
  const [q, setQ] = useState("");
  const [srv, setSrv] = useState("");
  const router = useRouter();

  const vchips = (
    <div className="chips">
      <button className="chip" aria-pressed={vw === "agenda"} onClick={() => setVw("agenda")}>Agenda do dia</button>
      <button className="chip" aria-pressed={vw === "lista"} onClick={() => setVw("lista")}>Lista</button>
    </div>
  );

  if (vw === "agenda") {
    const fs = data.funcionarios.filter((f) => f.ativo);
    const lst = tec ? d.os.filter((o) => o.funcionarioIds.includes(tec)) : d.os;
    return (
      <>
        <div className="topbar">
          <div><h1>Ordens de serviço</h1><div className="sub">Agenda da equipe por dia</div></div>
          <button className="btn pri" onClick={() => openM("osForm", { preset: { data: day } })}>{I.plus} Nova OS</button>
        </div>
        {vchips}
        {fs.length > 0 && (
          <div className="chips">
            <button className="chip" aria-pressed={!tec} onClick={() => setTec("")}>Toda a equipe</button>
            {fs.map((f) => <button key={f.id} className="chip" aria-pressed={tec === f.id} onClick={() => setTec(f.id)}>{f.nome}</button>)}
          </div>
        )}
        <DayAgenda list={lst} day={day} setDay={setDay} showEquipe />
      </>
    );
  }

  let list = d.os;
  if (st === "abertas") list = list.filter((o) => o.status === "agendada" || o.status === "em_andamento");
  else if (st === "semnf") list = list.filter((o) => o.status === "concluida" && !temNf(o));
  else if (st !== "todas") list = list.filter((o) => o.status === st);
  if (srv) list = list.filter((o) => o.itens.some((i) => i.servicoId === srv));
  if (per === "hoje") list = list.filter((o) => o.data === t);
  else if (per === "semana") list = list.filter((o) => o.data >= t && o.data <= addDays(t, 7));
  else if (per === "futuro") list = list.filter((o) => o.data >= addDays(t, -30));
  else if (per === "mes") list = list.filter((o) => mk(o.data) === mk(t));
  if (q) {
    const n = norm(q);
    list = list.filter(
      (o) => norm(d.cli[o.clienteId]?.nome).includes(n) || String(o.numero).includes(n) || norm(o.itens.map((i) => i.nome).join(" ")).includes(n),
    );
  }
  if (st === "concluida" || st === "todas" || st === "semnf") list = [...list].reverse();

  // resumo do serviço pesquisado (quantos serviços foram feitos e para quantos clientes)
  const resumo = srv
    ? {
        os: list.length,
        qtd: list.reduce((a, o) => a + o.itens.filter((i) => i.servicoId === srv).reduce((b, i) => b + (Number(i.qtd) || 0), 0), 0),
        clientes: new Set(list.map((o) => o.clienteId)).size,
      }
    : null;

  function abrirRelatorio() {
    const de = per === "hoje" ? t : per === "semana" ? t : per === "mes" ? mk(t) + "-01" : per === "futuro" ? addDays(t, -30) : "";
    const ate = per === "hoje" ? t : per === "semana" ? addDays(t, 7) : per === "mes" ? ymd(new Date(+t.slice(0, 4), +t.slice(5, 7), 0)) : "";
    const status = st === "abertas" ? "abertas" : st === "cancelada" ? "cancelada" : st === "todas" ? "todas" : "concluida";
    // de/ate vazios significam "sem limite"; sem os parâmetros o relatório usaria o mês atual
    const p = new URLSearchParams({ servico: srv, status, de, ate });
    router.push("/relatorios?" + p.toString());
  }

  const chip = (v: string, cur: string, set: (v: string) => void, l: string) => (
    <button className="chip" aria-pressed={cur === v} onClick={() => set(v)}>{l}</button>
  );

  return (
    <>
      <div className="topbar">
        <div><h1>Ordens de serviço</h1><div className="sub">{d.os.length} OS registradas</div></div>
        <button className="btn pri" onClick={() => openM("osForm")}>{I.plus} Nova OS</button>
      </div>
      {vchips}
      <div className="sec">
        <div className="toolbar">
          <div className="search">
            {I.search}
            <input id="os-q" type="search" placeholder="Buscar cliente, nº ou serviço" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select id="os-srv" aria-label="Filtrar por serviço" style={{ flex: "0 1 260px", minWidth: 200 }} value={srv} onChange={(e) => setSrv(e.target.value)}>
            <option value="">Todos os serviços</option>
            {[...data.servicos].sort((a, b) => a.nome.localeCompare(b.nome)).map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div className="chips">
          {chip("abertas", st, setSt, "Abertas")}{chip("concluida", st, setSt, "Concluídas")}{chip("semnf", st, setSt, "Concluídas sem NF")}
          {chip("cancelada", st, setSt, "Canceladas")}{chip("todas", st, setSt, "Todas")}
        </div>
        <div className="chips">
          {chip("hoje", per, setPer, "Hoje")}{chip("semana", per, setPer, "Próx. 7 dias")}{chip("mes", per, setPer, "Este mês")}
          {chip("futuro", per, setPer, "Recentes e futuras")}{chip("tudo", per, setPer, "Todo o período")}
        </div>
        {resumo && (
          <div className="banner">
            <div className="main">
              <b>{data.servicos.find((s) => s.id === srv)?.nome}</b>
              {resumo.qtd.toLocaleString("pt-BR")} {resumo.qtd === 1 ? "serviço feito" : "serviços feitos"} em {resumo.os} OS · {resumo.clientes} {resumo.clientes === 1 ? "cliente" : "clientes"}
            </div>
            <button className="btn pri" onClick={abrirRelatorio}>{I.os} Relatório para imprimir</button>
          </div>
        )}
        <OSGrouped list={list} emptyTitle="Nenhuma OS encontrada" emptyText="Mude os filtros ou crie uma nova OS." />
      </div>
    </>
  );
}
