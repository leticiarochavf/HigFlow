"use client";

import { useState } from "react";
import { gerarContratos } from "@/features/data/actions";
import { useUI } from "@/features/ui/ui-provider";

/** Botão "Gerar OS": cria as OS dos contratos com visita nos próximos 7 dias. */
export function useGerarContratos() {
  const { run, toast } = useUI();
  const [busy, setBusy] = useState(false);

  async function gerar() {
    setBusy(true);
    try {
      const n = await run(() => gerarContratos());
      toast(n ? `${n} OS ${n > 1 ? "geradas" : "gerada"} e na agenda` : "Nada para gerar");
    } catch {}
    setBusy(false);
  }
  return { busy, gerar };
}
