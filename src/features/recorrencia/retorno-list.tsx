"use client";

import { I } from "@/components/icons";
import { Empty, WaBtn } from "@/components/ui";
import { clearRetorno, setRetorno } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import { EMPRESA, RSTATUS, firstName, fmtDC, today } from "@/lib/format";
import type { Retorno } from "@/types/domain";

export function RetornoList({ list, compact }: { list: Retorno[]; compact?: boolean }) {
  const { d } = useData();
  const { run, openM } = useUI();
  const t = today();

  if (!list.length) {
    return (
      <div className="card">
        <Empty
          title="Nenhum retorno agora"
          text={compact ? "Quando um cliente estiver perto da próxima higienização, ele aparece aqui." : 'Defina "lembrar após X meses" nos serviços para gerar lembretes automáticos.'}
        />
      </div>
    );
  }

  const marca = (r: Retorno, st: "contatado" | "dispensado") =>
    run(() => setRetorno(r.clienteId, r.servicoId, r.osId, st), st === "contatado" ? "Marcado como contatado" : "Retorno dispensado");

  return (
    <div className="card list">
      {list.map((r) => {
        const c = d.cli[r.clienteId];
        const atras = r.due < t;
        const msg = `Olá ${firstName(c?.nome)}! Aqui é da ${EMPRESA}. Faz ${r.meses} meses da última ${r.servico.toLowerCase()} (${fmtDC(r.base)}). Quer agendar a próxima? Temos horários esta semana.`;
        return (
          <div key={r.id} style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div className="main" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{c?.nome}</div>
                <div className="small muted">{r.servico} · última em {fmtDC(r.base)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={"pill " + (r.status !== "pendente" ? "st-cancelada" : atras ? "pg-pendente" : "st-agendada")}>
                  {r.status !== "pendente" ? RSTATUS[r.status] : atras ? "Venceu " + fmtDC(r.due) : "Vence " + fmtDC(r.due)}
                </span>
              </div>
            </div>
            {r.status !== "agendado" && (
              <div className="acts">
                <WaBtn tel={c?.telefone} msg={msg} sm label="Oferecer" />
                <button
                  className="btn sm"
                  onClick={() =>
                    openM("osForm", {
                      preset: {
                        clienteId: r.clienteId,
                        itens: [{ servicoId: r.servicoId, nome: r.servico, qtd: 1, preco: "", unidade: d.serv[r.servicoId]?.unidade || "un" }],
                      },
                      retorno: { clienteId: r.clienteId, servicoId: r.servicoId, osId: r.osId },
                    })
                  }
                >
                  {I.cal} Agendar
                </button>
                {r.status === "pendente" && (
                  <>
                    <button className="btn sm ghost" onClick={() => marca(r, "contatado")}>Contatado</button>
                    <button className="btn sm ghost" onClick={() => marca(r, "dispensado")}>Dispensar</button>
                  </>
                )}
                {r.status !== "pendente" && (
                  <button className="btn sm ghost" onClick={() => run(() => clearRetorno(r.clienteId, r.servicoId, r.osId))}>Voltar para pendente</button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
