"use client";

import { useState } from "react";
import { Confirm, Field, Sheet } from "@/components/ui";
import { deleteDespesa, saveDespesa } from "@/features/data/actions";
import { useUI } from "@/features/ui/ui-provider";
import { CATS, mk, today } from "@/lib/format";
import type { Despesa } from "@/types/domain";

export function DespForm({ x, m }: { x?: Despesa; m?: string }) {
  const { run, closeM } = useUI();
  const [f, setF] = useState(() => ({
    descricao: x?.descricao || "",
    categoria: x?.categoria || CATS[0],
    valor: x ? String(x.valor) : "",
    data: x?.data || (m && m !== mk(today()) ? m + "-01" : today()),
  }));
  const [err, setErr] = useState("");
  const s = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });

  async function salvar() {
    if (!f.descricao.trim()) return setErr("Descreva a despesa.");
    if (!(+f.valor > 0)) return setErr("Informe o valor.");
    try {
      await run(() => saveDespesa(x?.id, { ...f, valor: +f.valor }), x ? "Despesa atualizada" : "Despesa lançada");
      closeM();
    } catch {}
  }

  return (
    <Sheet
      title={x ? "Editar despesa" : "Nova despesa"}
      footer={<><button className="btn" onClick={closeM}>Cancelar</button><button className="btn pri" onClick={salvar}>Salvar</button></>}
    >
      <div className="f">
        <Field label="Descrição">
          <input id="d-desc" placeholder="Ex.: Galão de detergente enzimático 5L" value={f.descricao} onChange={(e) => s("descricao", e.target.value)} />
        </Field>
        <div className="fr">
          <Field label="Categoria">
            <select id="d-cat" value={f.categoria} onChange={(e) => s("categoria", e.target.value)}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Valor (R$)"><input id="d-val" type="number" inputMode="decimal" min="0" step="0.01" value={f.valor} onChange={(e) => s("valor", e.target.value)} /></Field>
          <Field label="Data"><input id="d-data" type="date" value={f.data} onChange={(e) => s("data", e.target.value)} /></Field>
        </div>
        {err && <div className="note">{err}</div>}
        {x && <div><Confirm ask="Excluir despesa?" onYes={() => run(() => deleteDespesa(x.id), "Despesa excluída").then(closeM)} /></div>}
      </div>
    </Sheet>
  );
}
