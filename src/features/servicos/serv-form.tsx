"use client";

import { useState } from "react";
import { Confirm, Field, Sheet, Swatches } from "@/components/ui";
import { deleteServico, saveServico } from "@/features/data/actions";
import { useUI } from "@/features/ui/ui-provider";
import { UNID } from "@/lib/format";
import type { Servico, Unidade } from "@/types/domain";

export function ServForm({ s: s0 }: { s?: Servico }) {
  const { run, closeM } = useUI();
  const [f, setF] = useState(() => ({
    nome: s0?.nome || "", unidade: (s0?.unidade || "un") as Unidade,
    retornoMeses: s0 ? String(s0.retornoMeses) : "6", duracaoMin: s0 ? String(s0.duracaoMin) : "120",
    cor: s0?.cor || "verde", ativo: s0 ? s0.ativo : true,
  }));
  const [err, setErr] = useState("");
  const s = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });

  async function salvar() {
    if (!f.nome.trim()) return setErr("Informe o nome.");
    try {
      await run(
        () => saveServico(s0?.id, {
          nome: f.nome, unidade: f.unidade, retornoMeses: +f.retornoMeses || 0,
          duracaoMin: +f.duracaoMin || 120, cor: f.cor || "verde", ativo: f.ativo,
        }),
        s0 ? "Serviço atualizado" : "Serviço criado",
      );
      closeM();
    } catch {}
  }

  return (
    <Sheet
      title={s0 ? "Editar serviço" : "Novo serviço"}
      footer={<><button className="btn" onClick={closeM}>Cancelar</button><button className="btn pri" onClick={salvar}>Salvar</button></>}
    >
      <div className="f">
        <Field label="Nome" hint="O valor é informado em cada OS, na hora de cadastrar o serviço para o cliente."><input id="s-nome" placeholder="Ex.: Higienização de sofá" value={f.nome} onChange={(e) => s("nome", e.target.value)} /></Field>
        <div className="fr">
          <Field label="Cobrado por">
            <select id="s-un" value={f.unidade} onChange={(e) => s("unidade", e.target.value as Unidade)}>
              {Object.entries(UNID).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Lembrar após (meses)" hint="0 = sem lembrete de retorno"><input id="s-ret" type="number" min="0" step="1" value={f.retornoMeses} onChange={(e) => s("retornoMeses", e.target.value)} /></Field>
          <Field label="Duração média (min)" hint="Ocupa esse tempo na agenda"><input id="s-dur" type="number" min="15" step="15" value={f.duracaoMin} onChange={(e) => s("duracaoMin", e.target.value)} /></Field>
        </div>
        <div className="fset">
          <span className="lbl">Cor na agenda</span>
          <Swatches id="s-cor" value={f.cor} set={(v) => s("cor", v)} />
          <span className="hint">Cada OS com este serviço aparece nesta cor; dá para trocar na OS.</span>
        </div>
        <label className="check">
          <input id="s-ativo" type="checkbox" checked={f.ativo} onChange={(e) => s("ativo", e.target.checked)} /> Disponível para novas OS
        </label>
        {err && <div className="note">{err}</div>}
        {s0 && <div><Confirm ask="Excluir serviço? OS antigas não mudam." onYes={() => run(() => deleteServico(s0.id), "Serviço excluído").then(closeM)} /></div>}
      </div>
    </Sheet>
  );
}
