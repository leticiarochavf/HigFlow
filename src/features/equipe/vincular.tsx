"use client";

import { useState } from "react";
import { Field, Sheet } from "@/components/ui";
import { liberarAcesso } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import type { Papel, Pedido } from "@/types/domain";

/** Libera o acesso de quem pediu: liga a conta a uma ficha de funcionário (ou cria uma nova). */
export function Vincular({ a }: { a: Pedido }) {
  const { data } = useData();
  const { run, closeM } = useUI();
  const livres = data.funcionarios.filter((f) => !f.userId);
  const [fid, setFid] = useState(livres[0]?.id || "__novo");
  const [papel, setPapel] = useState<Papel>("funcionario");

  async function ok() {
    try {
      await run(() => liberarAcesso(a.userId, fid, papel, a.nome, a.telefone), "Acesso liberado");
      closeM();
    } catch {}
  }

  return (
    <Sheet
      title={"Liberar acesso para " + (a.nome || "pessoa")}
      footer={<><button className="btn" onClick={closeM}>Cancelar</button><button className="btn pri" onClick={ok}>Liberar</button></>}
    >
      <div className="f">
        <Field label="Ligar à ficha de">
          <select id="v-func" value={fid} onChange={(e) => setFid(e.target.value)}>
            {livres.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            <option value="__novo">+ Criar ficha nova com o nome &quot;{a.nome || ""}&quot;</option>
          </select>
        </Field>
        <Field label="Perfil">
          <select id="v-papel" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
            <option value="funcionario">Funcionário (só a própria agenda e comissões)</option>
            <option value="admin">Administrador (acesso total)</option>
          </select>
        </Field>
      </div>
    </Sheet>
  );
}
