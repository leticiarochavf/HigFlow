"use client";

import { useState } from "react";
import { I } from "@/components/icons";
import { Mark, Wordmark } from "@/components/brand";
import { WaBtn } from "@/components/ui";
import { useData } from "@/features/data/data-provider";
import { DayAgenda } from "@/features/os/day-agenda";
import { OSRow } from "@/features/os/os-row";
import { useUI } from "@/features/ui/ui-provider";
import { EMPRESA, corDe, corOS, endTxt, firstName, rotaLink, today } from "@/lib/format";

/** Visão do técnico: só as OS em que ele está escalado. */
export function MinhaAgenda() {
  const { d, role } = useData();
  const { openM } = useUI();
  const [day, setDay] = useState(today());
  if (role.r !== "func") return null;
  const f = role.f;
  const t = today();

  const mine = d.os.filter((o) => o.funcionarioIds.includes(f.id) && o.status !== "cancelada");
  const hoje = mine.filter((o) => o.data === t);
  const atras = mine.filter((o) => o.data < t && o.status !== "concluida");
  const prox = hoje.filter((o) => o.status !== "concluida").sort((a, b) => a.hora.localeCompare(b.hora))[0];
  const pc = prox && d.cli[prox.clienteId];
  const pk = prox && corDe(corOS(prox, d.serv));
  const concluidas = hoje.filter((o) => o.status === "concluida").length;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="mob-brand"><Mark w={46} sw={7} /><Wordmark h={20} /></div>
          <h1>Olá, {firstName(f.nome)}</h1>
          <div className="sub">
            {hoje.length ? `${hoje.length} serviço${hoje.length > 1 ? "s" : ""} hoje · ${concluidas} concluído${concluidas === 1 ? "" : "s"}` : "Nenhum serviço hoje"}
          </div>
        </div>
      </div>

      {prox && pk && (
        <section className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, borderTop: "4px solid " + pk.bd }}>
          <span className="lbl">{prox.status === "em_andamento" ? "Em andamento agora" : "Próximo serviço"}{prox.hora ? " · " + prox.hora : ""}</span>
          <div>
            <h2 style={{ fontSize: "1.25rem" }}>{pc?.nome || "Cliente"}</h2>
            <div className="small muted">{endTxt(pc) || "Endereço não cadastrado"}</div>
            <div className="small" style={{ marginTop: 4 }}>{prox.itens.map((i) => `${i.qtd}× ${i.nome}`).join(" · ")}</div>
          </div>
          <div className="acts">
            {rotaLink(pc) && <a className="btn pri" href={rotaLink(pc)!} target="_blank" rel="noopener noreferrer">{I.pin} Ir até o cliente</a>}
            <WaBtn
              tel={pc?.telefone}
              msg={`Olá ${firstName(pc?.nome)}! Aqui é o ${firstName(f.nome)}, da ${EMPRESA}. Estou a caminho para a ${prox.itens.map((i) => i.nome.toLowerCase()).join(", ")}.`}
              label="Avisar que estou a caminho"
            />
            <button className="btn" onClick={() => openM("osView", { id: prox.id })}>Abrir OS</button>
          </div>
        </section>
      )}

      {atras.length > 0 && (
        <section className="sec">
          <h2>Pendentes de dias anteriores</h2>
          <div className="card list">{atras.map((o) => <OSRow key={o.id} o={o} />)}</div>
        </section>
      )}

      <DayAgenda list={mine} day={day} setDay={setDay} />
    </>
  );
}
