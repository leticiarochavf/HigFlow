"use client";

import { useState } from "react";
import { Confirm, Field, Sheet } from "@/components/ui";
import { deleteFuncionario, saveFuncionario } from "@/features/data/actions";
import { useUI } from "@/features/ui/ui-provider";
import type { Funcionario, Papel } from "@/types/domain";

type Form = {
  nome: string; telefone: string; funcao: string; admissao: string; comissaoTipo: "pct" | "fixo";
  comissaoValor: string; papel: Papel; ativo: boolean; userId: string | null;
};

export function FuncForm({ f: f0 }: { f?: Funcionario }) {
  const { run, closeM } = useUI();
  const [f, setF] = useState<Form>(() => ({
    nome: f0?.nome || "", telefone: f0?.telefone || "", funcao: f0 ? f0.funcao : "Técnico de higienização",
    admissao: f0?.admissao || "", comissaoTipo: f0?.comissaoTipo || "pct",
    comissaoValor: f0 ? String(f0.comissaoValor || "") : "", papel: f0?.papel || "funcionario",
    ativo: f0 ? f0.ativo : true, userId: f0?.userId ?? null,
  }));
  const [err, setErr] = useState("");
  const s = <K extends keyof Form>(k: K, v: Form[K]) => setF({ ...f, [k]: v });

  async function salvar() {
    if (!f.nome.trim()) return setErr("Informe o nome.");
    try {
      await run(
        () => saveFuncionario(f0?.id, { ...f, comissaoValor: f.comissaoValor === "" ? 0 : +f.comissaoValor }),
        f0 ? "Funcionário atualizado" : "Funcionário cadastrado",
      );
      closeM();
    } catch {}
  }

  return (
    <Sheet
      title={f0 ? "Editar funcionário" : "Novo funcionário"}
      footer={<><button className="btn" onClick={closeM}>Cancelar</button><button className="btn pri" onClick={salvar}>Salvar</button></>}
    >
      <div className="f">
        <Field label="Nome completo"><input id="f-nome" value={f.nome} onChange={(e) => s("nome", e.target.value)} /></Field>
        <div className="fr">
          <Field label="Telefone"><input id="f-tel" type="tel" value={f.telefone} onChange={(e) => s("telefone", e.target.value)} /></Field>
          <Field label="Função"><input id="f-func" value={f.funcao} onChange={(e) => s("funcao", e.target.value)} /></Field>
          <Field label="Admissão"><input id="f-adm" type="date" value={f.admissao} onChange={(e) => s("admissao", e.target.value)} /></Field>
        </div>
        <div className="fset">
          <span className="lbl">Comissão</span>
          <div className="fr">
            <Field label="Tipo">
              <select id="f-ctipo" value={f.comissaoTipo} onChange={(e) => s("comissaoTipo", e.target.value as "pct" | "fixo")}>
                <option value="pct">% do valor da OS</option>
                <option value="fixo">Valor fixo por OS</option>
              </select>
            </Field>
            <Field label={f.comissaoTipo === "fixo" ? "Valor (R$)" : "Percentual (%)"} hint="Com mais de um na OS, o % é dividido">
              <input id="f-cval" type="number" inputMode="decimal" min="0" step="0.01" value={f.comissaoValor} onChange={(e) => s("comissaoValor", e.target.value)} />
            </Field>
          </div>
        </div>
        {f.userId && (
          <div className="fset">
            <span className="lbl">Acesso ao sistema</span>
            <div className="fr" style={{ alignItems: "end" }}>
              <Field label="Perfil">
                <select id="f-papel" value={f.papel} onChange={(e) => s("papel", e.target.value as Papel)}>
                  <option value="funcionario">Funcionário (só a própria agenda)</option>
                  <option value="admin">Administrador (tudo)</option>
                </select>
              </Field>
              <button className="btn sm danger" onClick={() => setF({ ...f, userId: null })}>Remover acesso</button>
            </div>
          </div>
        )}
        <label className="check">
          <input id="f-ativo" type="checkbox" checked={f.ativo} onChange={(e) => s("ativo", e.target.checked)} /> Funcionário ativo
        </label>
        {err && <div className="note">{err}</div>}
        {f0 && <div><Confirm ask="Excluir funcionário? Prefira marcar inativo." onYes={() => run(() => deleteFuncionario(f0.id), "Funcionário excluído").then(closeM)} /></div>}
      </div>
    </Sheet>
  );
}
