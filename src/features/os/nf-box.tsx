"use client";

import { useState } from "react";
import { Confirm, Field } from "@/components/ui";
import { patchOS } from "@/features/data/actions";
import { useUI } from "@/features/ui/ui-provider";
import { NF_VAZIA, fmtDC, rotuloNf, temNf, today } from "@/lib/format";
import type { Nf, OS } from "@/types/domain";

/** Só aceita endereços http(s), para o link da NF nunca virar um script. */
const linkSeguro = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : null);

/** Cadastro da nota fiscal da OS: número, série, data de emissão e link opcional do PDF/XML. */
export function NfBox({ os, isAdmin }: { os: OS; isAdmin: boolean }) {
  const { run } = useUI();
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState<Nf>(os.nf);
  const [err, setErr] = useState("");
  const tem = temNf(os);
  const link = linkSeguro(os.nf.link);

  function abrir() {
    setF(tem ? os.nf : { ...NF_VAZIA, emissao: today() });
    setErr("");
    setEditando(true);
  }

  async function salvar() {
    if (!f.numero.trim()) return setErr("Informe o número da nota fiscal.");
    if (f.link.trim() && !linkSeguro(f.link)) return setErr("O link precisa começar com http:// ou https://.");
    try {
      await run(() => patchOS(os.id, { nf: f }), "Nota fiscal salva");
      setEditando(false);
    } catch {}
  }

  return (
    <div className="fset">
      <span className="lbl">Nota fiscal</span>
      {editando ? (
        <div className="f">
          <div className="fr">
            <Field label="Número"><input id="nf-num" inputMode="numeric" value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value })} /></Field>
            <Field label="Série"><input id="nf-serie" value={f.serie} onChange={(e) => setF({ ...f, serie: e.target.value })} /></Field>
            <Field label="Emissão"><input id="nf-data" type="date" value={f.emissao || ""} onChange={(e) => setF({ ...f, emissao: e.target.value || null })} /></Field>
          </div>
          <Field label="Link do PDF ou XML (opcional)" hint="Cole o endereço da nota, se ela estiver salva na nuvem.">
            <input id="nf-link" type="url" inputMode="url" placeholder="https://…" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} />
          </Field>
          {err && <div className="note">{err}</div>}
          <div className="acts">
            <button className="btn sm pri" onClick={salvar}>Salvar NF</button>
            <button className="btn sm" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </div>
      ) : tem ? (
        <div className="acts" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <span>
            <b>{rotuloNf(os.nf)}</b>{os.nf.emissao ? ` · emitida em ${fmtDC(os.nf.emissao)}` : ""}
          </span>
          <span className="acts">
            {link && <a className="btn sm" href={link} target="_blank" rel="noopener noreferrer">Abrir NF</a>}
            {isAdmin && <button className="btn sm ghost" onClick={abrir}>Editar</button>}
            {isAdmin && <Confirm label="Remover" ask="Remover a NF?" onYes={() => run(() => patchOS(os.id, { nf: NF_VAZIA }), "Nota fiscal removida")} />}
          </span>
        </div>
      ) : (
        <div className="acts" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <span className="hint">Nenhuma nota fiscal cadastrada nesta OS.</span>
          {isAdmin && <button className="btn sm" onClick={abrir}>Cadastrar NF</button>}
        </div>
      )}
    </div>
  );
}
