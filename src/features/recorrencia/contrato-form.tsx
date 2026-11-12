"use client";

import { useState } from "react";
import { Confirm, Field, FormasOptions, Sheet } from "@/components/ui";
import { deleteContrato, saveContrato } from "@/features/data/actions";
import { ClientePicker, FuncPicker, ItemsEditor, ensureCliente, itemVazio, semValor, sumItens, type NovoCliente } from "@/features/os/editors";
import { useUI } from "@/features/ui/ui-provider";
import { FREQ, brl, clone, today } from "@/lib/format";
import type { Contrato, Frequencia, Item } from "@/types/domain";

type Form = {
  clienteId: string; frequencia: Frequencia; proximaData: string; hora: string; funcionarioIds: string[];
  itens: Item[]; forma: string; obs: string; ativo: boolean;
};

export function ContratoForm({ c }: { c?: Contrato }) {
  const { run, closeM } = useUI();
  const [f, setF] = useState<Form>(() =>
    c
      ? clone(c)
      : { clienteId: "", frequencia: "mensal", proximaData: today(), hora: "09:00", funcionarioIds: [], itens: [itemVazio()], forma: "pix", obs: "", ativo: true },
  );
  const [novo, setNovo] = useState<NovoCliente | null>(null);
  const [err, setErr] = useState("");
  const s = <K extends keyof Form>(k: K, v: Form[K]) => setF({ ...f, [k]: v });
  const total = sumItens(f.itens, 0);

  async function salvar() {
    const itens = f.itens.filter((i) => i.servicoId);
    if (!novo && !f.clienteId) return setErr("Escolha o cliente.");
    if (!itens.length) return setErr("Adicione pelo menos um serviço.");
    if (semValor(itens)) return setErr("Informe o valor de cada serviço.");
    if (!f.proximaData) return setErr("Informe a próxima visita.");
    setErr("");
    try {
      const clienteId = await run(() => ensureCliente(f.clienteId, novo));
      await run(
        () => saveContrato(c?.id, {
          clienteId, frequencia: f.frequencia, proximaData: f.proximaData, hora: f.hora, forma: f.forma,
          obs: f.obs, ativo: f.ativo, itens, funcionarioIds: f.funcionarioIds, total,
        }),
        c ? "Contrato atualizado" : "Contrato criado",
      );
      closeM();
    } catch {}
  }

  return (
    <Sheet
      title={c ? "Editar contrato" : "Novo contrato recorrente"}
      footer={<><button className="btn" onClick={closeM}>Cancelar</button><button className="btn pri" onClick={salvar}>Salvar</button></>}
    >
      <div className="f">
        <ClientePicker value={f.clienteId} set={(v) => s("clienteId", v)} novo={novo} setNovo={setNovo} />
        <div className="fr">
          <Field label="Frequência">
            <select id="ct-freq" value={f.frequencia} onChange={(e) => s("frequencia", e.target.value as Frequencia)}>
              {Object.entries(FREQ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Próxima visita"><input id="ct-data" type="date" value={f.proximaData} onChange={(e) => s("proximaData", e.target.value)} /></Field>
          <Field label="Horário"><input id="ct-hora" type="time" value={f.hora} onChange={(e) => s("hora", e.target.value)} /></Field>
        </div>
        <ItemsEditor itens={f.itens} set={(v) => s("itens", v)} />
        <FuncPicker ids={f.funcionarioIds} set={(v) => s("funcionarioIds", v)} />
        <div className="fr">
          <Field label="Forma de pagamento">
            <select id="ct-forma" value={f.forma} onChange={(e) => s("forma", e.target.value)}><FormasOptions /></select>
          </Field>
        </div>
        <Field label="Observações"><textarea id="ct-obs" value={f.obs} onChange={(e) => s("obs", e.target.value)} /></Field>
        <label className="check">
          <input id="ct-ativo" type="checkbox" checked={f.ativo} onChange={(e) => s("ativo", e.target.checked)} /> Contrato ativo
        </label>
        <div className="tot"><span>Valor por visita</span><b>{brl(total)}</b></div>
        {err && <div className="note">{err}</div>}
        {c && <div><Confirm ask="Excluir contrato? As OS já geradas ficam." onYes={() => run(() => deleteContrato(c.id), "Contrato excluído").then(closeM)} /></div>}
      </div>
    </Sheet>
  );
}
