"use client";

import { useState } from "react";
import { BrandStack } from "@/components/brand";
import { Field } from "@/components/ui";
import { pedirAcesso } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";

/** Tela de quem já tem conta mas ainda não foi liberado pelo administrador. */
export function Pending() {
  const { me, data, signOut } = useData();
  const { run } = useUI();
  const pedido = data.pedidos.find((p) => p.userId === me?.id);
  const [nome, setNome] = useState(me?.name || "");
  const [tel, setTel] = useState("");
  const [busy, setBusy] = useState(false);

  async function pedir() {
    if (!me?.id || !nome.trim()) return;
    setBusy(true);
    try {
      await run(() => pedirAcesso(me.id!, nome.trim(), tel), "Pedido enviado");
    } catch {}
    setBusy(false);
  }

  return (
    <div className="center">
      <div className="card">
        <BrandStack />
        {pedido ? (
          <p style={{ margin: 0 }}>
            Pedido enviado como <b>{pedido.nome}</b>. Assim que o administrador liberar, esta tela vira sua agenda. Pode deixar aberta.
          </p>
        ) : (
          <>
            <p className="muted" style={{ margin: 0 }}>Você ainda não tem acesso. Informe seu nome para o administrador liberar.</p>
            <Field label="Seu nome"><input id="p-nome" value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
            <Field label="Telefone (opcional)"><input id="p-tel" type="tel" value={tel} onChange={(e) => setTel(e.target.value)} /></Field>
            <button className="btn pri" disabled={busy || !nome.trim()} onClick={pedir}>Pedir acesso</button>
          </>
        )}
        <button className="btn sm" style={{ width: "100%" }} onClick={signOut}>Sair</button>
      </div>
    </div>
  );
}
