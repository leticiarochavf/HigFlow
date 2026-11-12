"use client";

import { useState } from "react";
import { Field, Sheet } from "@/components/ui";
import { saveCliente } from "@/features/data/actions";
import { useUI } from "@/features/ui/ui-provider";
import { coordsDe, isUrl } from "@/lib/format";
import type { Cliente } from "@/types/domain";

export function ClienteForm({ c }: { c?: Cliente }) {
  const { run, closeM } = useUI();
  const [f, setF] = useState(() => ({
    nome: c?.nome || "", telefone: c?.telefone || "", endereco: c?.endereco || "", bairro: c?.bairro || "",
    cidade: c ? c.cidade : "Criciúma", mapsUrl: c?.mapsUrl || "", obs: c?.obs || "",
  }));
  const [err, setErr] = useState("");
  const s = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });

  async function salvar() {
    if (!f.nome.trim()) return setErr("Informe o nome.");
    try {
      await run(() => saveCliente(c?.id, f), c ? "Cliente atualizado" : "Cliente cadastrado");
      closeM();
    } catch {}
  }

  return (
    <Sheet
      title={c ? "Editar cliente" : "Novo cliente"}
      footer={<><button className="btn" onClick={closeM}>Cancelar</button><button className="btn pri" onClick={salvar}>Salvar</button></>}
    >
      <div className="f">
        <Field label="Nome"><input id="c-nome" value={f.nome} onChange={(e) => s("nome", e.target.value)} /></Field>
        <Field label="Telefone / WhatsApp" hint="Com DDD, ex.: 48 99999-0000"><input id="c-tel" type="tel" value={f.telefone} onChange={(e) => s("telefone", e.target.value)} /></Field>
        <Field label="Endereço"><input id="c-end" value={f.endereco} onChange={(e) => s("endereco", e.target.value)} /></Field>
        <div className="fr">
          <Field label="Bairro"><input id="c-bai" value={f.bairro} onChange={(e) => s("bairro", e.target.value)} /></Field>
          <Field label="Cidade"><input id="c-cid" value={f.cidade} onChange={(e) => s("cidade", e.target.value)} /></Field>
        </div>
        <Field label="Localização no Google Maps (opcional)" hint="Cole o link do Maps ou a localização que o cliente mandou no WhatsApp. Sem link, a rota usa o endereço.">
          <input id="c-maps" type="url" inputMode="url" placeholder="https://maps.app.goo.gl/…" value={f.mapsUrl} onChange={(e) => s("mapsUrl", e.target.value)} />
        </Field>
        {f.mapsUrl && !isUrl(f.mapsUrl) && !coordsDe(f.mapsUrl) && <div className="note">Esse link não parece ser do Google Maps. Confira se copiou o link certo.</div>}
        <Field label="Observações">
          <textarea id="c-obs" placeholder="Ex.: tem cachorro, portão azul, prefere manhã" value={f.obs} onChange={(e) => s("obs", e.target.value)} />
        </Field>
        {err && <div className="note">{err}</div>}
      </div>
    </Sheet>
  );
}
