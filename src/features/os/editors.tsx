"use client";

import { I } from "@/components/icons";
import { Field } from "@/components/ui";
import { saveCliente } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import type { Item } from "@/types/domain";

export type NovoCliente = { nome: string; telefone: string; endereco: string; bairro: string; cidade: string };

export const itemVazio = (): Item => ({ servicoId: "", nome: "", qtd: 1, preco: "", unidade: "un" });

/** Há algum serviço escolhido sem valor informado? O valor é digitado em cada OS. */
export const semValor = (itens: Item[]) => itens.some((i) => i.servicoId && i.preco === "");

export const sumItens = (itens: Item[], desc: number | string | null) =>
  Math.max(0, itens.reduce((a, it) => a + (Number(it.qtd) || 0) * (Number(it.preco) || 0), 0) - (Number(desc) || 0));

/** Cria o cliente digitado na hora (se houver) e devolve o id a usar. */
export async function ensureCliente(clienteId: string, novo: NovoCliente | null): Promise<string> {
  if (!novo) return clienteId;
  if (!novo.nome.trim()) throw new Error("nome");
  return saveCliente(undefined, novo);
}

export function ItemsEditor({ itens, set }: { itens: Item[]; set: (v: Item[]) => void }) {
  const { data } = useData();
  const servs = data.servicos
    .filter((s) => s.ativo || itens.some((i) => i.servicoId === s.id))
    .sort((a, b) => a.nome.localeCompare(b.nome));
  const upd = (i: number, p: Partial<Item>) => set(itens.map((it, j) => (j === i ? { ...it, ...p } : it)));
  const pick = (i: number, sid: string) => {
    const s = data.servicos.find((x) => x.id === sid);
    upd(i, { servicoId: sid, nome: s?.nome || "", unidade: s?.unidade || "un" });
  };
  return (
    <div className="fset">
      <span className="lbl">Serviços</span>
      {!servs.length && <div className="note">Cadastre os serviços no menu Serviços antes de montar a OS.</div>}
      {itens.map((it, i) => (
        <div className="item-row" key={i}>
          <Field label={i ? "" : "Serviço"}>
            <select id={"it-s-" + i} value={it.servicoId} onChange={(e) => pick(i, e.target.value)}>
              <option value="">Escolha…</option>
              {servs.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </Field>
          <Field label={i ? "" : "Qtd"}>
            <input id={"it-q-" + i} type="number" inputMode="decimal" min="0" step="0.5" value={it.qtd} onChange={(e) => upd(i, { qtd: e.target.value === "" ? "" : +e.target.value })} />
          </Field>
          <Field label={i ? "" : "Valor un. (R$)"}>
            <input id={"it-p-" + i} type="number" inputMode="decimal" min="0" step="0.01" placeholder="0,00" value={it.preco} onChange={(e) => upd(i, { preco: e.target.value === "" ? "" : +e.target.value })} />
          </Field>
          <button className="icon-btn" aria-label="Remover serviço" onClick={() => set(itens.filter((_, j) => j !== i))}>{I.x}</button>
        </div>
      ))}
      <div><button className="btn sm" onClick={() => set([...itens, itemVazio()])}>{I.plus} Adicionar serviço</button></div>
    </div>
  );
}

export function FuncPicker({ ids, set }: { ids: string[]; set: (v: string[]) => void }) {
  const { data } = useData();
  const fs = data.funcionarios.filter((f) => f.ativo).sort((a, b) => a.nome.localeCompare(b.nome));
  const tog = (id: string) => set(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  return (
    <div className="fset">
      <span className="lbl">Equipe</span>
      {fs.length ? (
        <div className="chips">
          {fs.map((f) => <button key={f.id} type="button" className="chip" aria-pressed={ids.includes(f.id)} onClick={() => tog(f.id)}>{f.nome}</button>)}
        </div>
      ) : (
        <span className="hint">Cadastre funcionários no menu Equipe.</span>
      )}
    </div>
  );
}

export function ClientePicker({
  value, set, novo, setNovo,
}: { value: string; set: (v: string) => void; novo: NovoCliente | null; setNovo: (n: NovoCliente | null) => void }) {
  const { data } = useData();
  const cs = [...data.clientes].sort((a, b) => a.nome.localeCompare(b.nome));
  if (novo) {
    return (
      <div className="fset">
        <div className="sec-h">
          <span className="lbl">Novo cliente</span>
          <button className="btn sm ghost" onClick={() => setNovo(null)}>Escolher existente</button>
        </div>
        <div className="fr">
          <Field label="Nome"><input id="nc-nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></Field>
          <Field label="Telefone / WhatsApp"><input id="nc-tel" type="tel" value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} /></Field>
        </div>
        <div className="fr">
          <Field label="Endereço"><input id="nc-end" value={novo.endereco} onChange={(e) => setNovo({ ...novo, endereco: e.target.value })} /></Field>
          <Field label="Bairro"><input id="nc-bai" value={novo.bairro} onChange={(e) => setNovo({ ...novo, bairro: e.target.value })} /></Field>
        </div>
      </div>
    );
  }
  return (
    <div className="fr" style={{ alignItems: "end" }}>
      <Field label="Cliente">
        <select id="os-cli" value={value} onChange={(e) => set(e.target.value)}>
          <option value="">Escolha o cliente…</option>
          {cs.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.bairro ? " — " + c.bairro : ""}</option>)}
        </select>
      </Field>
      <button className="btn" onClick={() => setNovo({ nome: "", telefone: "", endereco: "", bairro: "", cidade: "Criciúma" })}>{I.plus} Novo cliente</button>
    </div>
  );
}
