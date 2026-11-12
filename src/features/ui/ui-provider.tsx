"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ModalKind =
  | "osView" | "osForm" | "cliForm" | "cliView" | "contratoForm" | "despForm"
  | "funcForm" | "servForm" | "vincular" | "mais";

type ModalState = { kind: ModalKind; props: Record<string, unknown> } | null;
type ToastItem = { id: number; msg: string; kind?: "err" };

type Ctx = {
  modal: ModalState;
  toasts: ToastItem[];
  openM: (kind: ModalKind, props?: Record<string, unknown>) => void;
  closeM: () => void;
  toast: (msg: string, kind?: "err") => void;
  /** Executa uma gravação, avisa o resultado e repassa o erro para quem chamou. */
  run: <T>(fn: () => Promise<T>, okMsg?: string) => Promise<T>;
};

const UICtx = createContext<Ctx | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((msg: string, kind?: "err") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, okMsg?: string) => {
      try {
        const r = await fn();
        if (okMsg) toast(okMsg);
        return r;
      } catch (e) {
        console.error(e);
        const code = (e as { code?: string })?.code;
        toast(
          code === "42501"
            ? "Sem permissão para salvar. Peça acesso ao administrador."
            : "Não deu para salvar. Confira a conexão e tente de novo.",
          "err",
        );
        throw e;
      }
    },
    [toast],
  );

  const value = useMemo<Ctx>(
    () => ({
      modal, toasts, toast, run,
      openM: (kind, props = {}) => setModal({ kind, props }),
      closeM: () => setModal(null),
    }),
    [modal, toasts, toast, run],
  );
  return <UICtx.Provider value={value}>{children}</UICtx.Provider>;
}

export function useUI(): Ctx {
  const c = useContext(UICtx);
  if (!c) throw new Error("useUI fora do UIProvider");
  return c;
}
