"use client";

import { useRouter } from "next/navigation";
import { I } from "@/components/icons";
import { Mark, Wordmark } from "@/components/brand";
import { Empty } from "@/components/ui";
import { useData } from "@/features/data/data-provider";
import { OSGrouped, OSRow } from "@/features/os/os-row";
import { RetornoList } from "@/features/recorrencia/retorno-list";
import { useGerarContratos } from "@/features/recorrencia/use-gerar-contratos";
import { useUI } from "@/features/ui/ui-provider";
import { EMPRESA, MES, addDays, brl, mk, today } from "@/lib/format";

export function PainelPage() {
  const { d, data } = useData();
  const { openM } = useUI();
  const { busy, gerar } = useGerarContratos();
  const router = useRouter();
  const t = today();
  const m = mk(t);

  const hoje = d.os.filter((o) => o.data === t && o.status !== "cancelada");
  const prox = d.os.filter((o) => o.data > t && o.data <= addDays(t, 7) && o.status !== "cancelada");
  const aReceber = d.os.filter((o) => o.status === "concluida" && o.pagamento.status !== "pago").reduce((a, o) => a + (o.total || 0), 0);
  const fat = d.os.filter((o) => o.status === "concluida" && mk(o.data) === m).reduce((a, o) => a + (o.total || 0), 0);
  const semCadastro = !data.servicos.length;
  const dataExtenso = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <div className="topbar">
        <div>
          <div className="mob-brand"><Mark w={46} sw={7} /><Wordmark h={20} /></div>
          <h1>Painel</h1>
          <div className="sub">{dataExtenso[0].toUpperCase() + dataExtenso.slice(1)}</div>
        </div>
        <button className="btn pri" onClick={() => openM("osForm")}>{I.plus} Nova OS</button>
      </div>

      {semCadastro && (
        <div className="banner">
          <div className="main"><b>Comece pelo catálogo de serviços</b>Cadastre os serviços da {EMPRESA} para montar as ordens de serviço.</div>
          <button className="btn" onClick={() => router.push("/servicos")}>Abrir serviços</button>
        </div>
      )}

      {d.contratosDue.length > 0 && (
        <div className="banner">
          <div className="main">
            <b>{d.contratosDue.length} {d.contratosDue.length > 1 ? "contratos recorrentes têm" : "contrato recorrente tem"} visita nos próximos 7 dias</b>
            Gere as OS para que entrem na agenda da equipe.
          </div>
          <button className="btn pri" disabled={busy} onClick={gerar}>{I.repeat} {busy ? "Gerando…" : "Gerar OS"}</button>
        </div>
      )}

      <div className="kpis">
        <div className="card kpi hl"><span className="lbl">OS hoje</span><span className="v">{hoje.length}</span><span className="d">{hoje.filter((o) => o.status === "concluida").length} concluídas</span></div>
        <div className="card kpi"><span className="lbl">A receber</span><span className="v">{brl(aReceber)}</span><span className="d">serviços feitos não pagos</span></div>
        <div className="card kpi"><span className="lbl">Faturado em {MES[new Date().getMonth()]}</span><span className="v">{brl(fat)}</span><span className="d">OS concluídas no mês</span></div>
        <div className="card kpi"><span className="lbl">Retornos</span><span className="v">{d.retPend.length}</span><span className="d">clientes para oferecer</span></div>
      </div>

      <div className="grid2">
        <section className="sec">
          <div className="sec-h"><h2>Agenda de hoje</h2><button className="btn sm ghost" onClick={() => router.push("/os")}>Ver todas</button></div>
          {hoje.length ? (
            <div className="card list">{hoje.map((o) => <OSRow key={o.id} o={o} showDate={false} />)}</div>
          ) : (
            <div className="card"><Empty title="Nenhum serviço hoje" text="Toque em Nova OS para agendar." /></div>
          )}
          <div className="sec-h" style={{ marginTop: 8 }}><h2>Próximos 7 dias</h2></div>
          <OSGrouped list={prox} emptyTitle="Agenda livre" emptyText="Nada agendado para a próxima semana." />
        </section>
        <section className="sec">
          <div className="sec-h"><h2>Retornos para oferecer</h2><button className="btn sm ghost" onClick={() => router.push("/recorrencia")}>Ver todos</button></div>
          <RetornoList list={d.retPend.slice(0, 5)} compact />
        </section>
      </div>
    </>
  );
}
