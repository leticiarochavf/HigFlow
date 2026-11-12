"use client";

import { useEffect, useState, type ReactNode } from "react";
import { I } from "./icons";
import { useUI } from "@/features/ui/ui-provider";
import { CORES, FORMAS, STATUS, fmtMes, shiftMes, waLink } from "@/lib/format";
import type { Pagamento, StatusOS } from "@/types/domain";

export const Pill = ({ st }: { st: StatusOS }) => <span className={"pill st-" + st}>{STATUS[st] || st}</span>;

export const PgPill = ({ p }: { p?: Pagamento | null }) =>
  p ? <span className={"pill pg-" + (p.status || "pendente")}>{p.status === "pago" ? "Pago" : "A receber"}</span> : null;

export function Confirm({ label = "Excluir", ask = "Excluir mesmo?", onYes }: { label?: string; ask?: string; onYes: () => void }) {
  const [aberto, setAberto] = useState(false);
  return aberto ? (
    <span className="acts">
      <span className="small" style={{ alignSelf: "center", fontWeight: 600 }}>{ask}</span>
      <button className="btn sm danger solid" onClick={onYes}>Sim, excluir</button>
      <button className="btn sm" onClick={() => setAberto(false)}>Não</button>
    </span>
  ) : (
    <button className="btn sm danger" onClick={() => setAberto(true)}>{I.trash} {label}</button>
  );
}

export function Sheet({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  const { closeM } = useUI();
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") closeM() };
    addEventListener("keydown", k);
    document.documentElement.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.documentElement.style.overflow = "" };
  }, [closeM]);
  return (
    <div className="ov" onClick={(e) => { if (e.target === e.currentTarget) closeM() }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="sh-h">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={closeM} aria-label="Fechar">{I.x}</button>
        </header>
        <div className="sh-b">{children}</div>
        {footer && <footer className="sh-f">{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label?: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="fl">
      {label}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <b>{title}</b>
      {text && <span>{text}</span>}
      {action}
    </div>
  );
}

export function MonthNav({ m, set }: { m: string; set: (m: string) => void }) {
  return (
    <div className="toolbar">
      <button className="icon-btn" aria-label="Mês anterior" onClick={() => set(shiftMes(m, -1))}>{I.left}</button>
      <b style={{ minWidth: 150, textAlign: "center", textTransform: "capitalize" }}>{fmtMes(m)}</b>
      <button className="icon-btn" aria-label="Próximo mês" onClick={() => set(shiftMes(m, 1))}>{I.right}</button>
    </div>
  );
}

export function WaBtn({ tel, msg, label = "WhatsApp", sm }: { tel?: string; msg?: string; label?: string; sm?: boolean }) {
  const l = waLink(tel, msg);
  return l ? (
    <a className={"btn" + (sm ? " sm" : "")} href={l} target="_blank" rel="noopener noreferrer">{I.chat} {label}</a>
  ) : null;
}

export function Swatches({ value, set, id }: { value: string; set: (k: string) => void; id?: string }) {
  return (
    <div className="sw" role="group" aria-label="Cor" id={id}>
      {Object.entries(CORES).map(([k, c]) => (
        <button key={k} type="button" aria-pressed={value === k} aria-label={c.n} title={c.n} style={{ background: c.bd }} onClick={() => set(k)}>
          {value === k ? I.check : null}
        </button>
      ))}
    </div>
  );
}

export function Toasts() {
  const { toasts } = useUI();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className={"toast" + (t.kind === "err" ? " err" : "")}>{t.msg}</div>)}
    </div>
  );
}

export const FormasOptions = () => (
  <>{Object.entries(FORMAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</>
);
