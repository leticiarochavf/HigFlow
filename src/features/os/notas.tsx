"use client";

import { useState } from "react";
import { addNota } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import { pad } from "@/lib/format";
import type { OS } from "@/types/domain";

const fmtNota = (iso: string) => {
  const x = new Date(iso);
  return isNaN(x.getTime()) ? "" : `${pad(x.getDate())}/${pad(x.getMonth() + 1)} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

export function Notas({ os }: { os: OS }) {
  const { data, d, role } = useData();
  const { run } = useUI();
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const meuId = role.r === "admin" || role.r === "func" ? role.f?.id ?? null : null;
  const ns = data.notas.filter((n) => n.osId === os.id).sort((a, b) => a.em.localeCompare(b.em));

  async function adicionar() {
    if (!texto.trim()) return;
    setBusy(true);
    try {
      await run(() => addNota(os.id, texto.trim(), meuId), "Anotação salva");
      setTexto("");
    } catch {}
    setBusy(false);
  }

  return (
    <div className="fset">
      <span className="lbl">Anotações e observações ({ns.length})</span>
      {ns.length ? (
        <div className="notes">
          {ns.map((n) => (
            <div className="nt" key={n.id}>
              <div className="m">
                <b>{n.funcionarioId ? d.func[n.funcionarioId]?.nome || "Funcionário" : "Escritório"}</b>
                <span>{fmtNota(n.em)}</span>
                {n.origem === "whatsapp" && <span className="tag">via WhatsApp</span>}
              </div>
              <p>{n.texto}</p>
            </div>
          ))}
        </div>
      ) : (
        <span className="hint">Registre o que foi visto no local: tipo de tecido, manchas, pedidos do cliente.</span>
      )}
      <textarea id="nota-txt" placeholder="Ex.: tecido suede, mancha de vinho no assento do meio; cliente quer impermeabilizar na próxima" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div><button className="btn sm pri" disabled={busy || !texto.trim()} onClick={adicionar}>Adicionar anotação</button></div>
    </div>
  );
}
