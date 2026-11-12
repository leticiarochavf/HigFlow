"use client";

import { useState } from "react";
import { Field, FormasOptions, Sheet, Swatches } from "@/components/ui";
import { saveOS, setRetorno } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import { NF_VAZIA, STATUS, brl, clone, numOS, today } from "@/lib/format";
import type { Item, OS, Pagamento, StatusOS } from "@/types/domain";
import { ClientePicker, FuncPicker, ItemsEditor, ensureCliente, itemVazio, semValor, sumItens, type NovoCliente } from "./editors";

type Form = {
  clienteId: string;
  data: string;
  hora: string;
  duracao: number | "" | null;
  status: StatusOS;
  desconto: number | "";
  cor: string | null;
  obs: string;
  funcionarioIds: string[];
  itens: Item[];
  pagamento: Pagamento;
  concluidaEm: string | null;
  contratoId: string | null;
};

type Props = {
  os?: OS;
  preset?: { clienteId?: string; data?: string; itens?: Item[] };
  /** Quando a OS nasce de um lembrete de retorno, marca o retorno como agendado. */
  retorno?: { clienteId: string; servicoId: string; osId: string };
};

export function OSForm({ os, preset, retorno }: Props) {
  const { data } = useData();
  const { run, closeM } = useUI();
  const [f, setF] = useState<Form>(() =>
    os
      ? clone({ ...os, duracao: os.duracao })
      : {
          clienteId: preset?.clienteId || "", data: preset?.data || today(), hora: "09:00", duracao: null,
          status: "agendada", desconto: 0, cor: null, obs: "", funcionarioIds: [],
          itens: preset?.itens || [itemVazio()], pagamento: { forma: "pix", status: "pendente", pagoEm: null },
          concluidaEm: null, contratoId: null,
        },
  );
  const [novo, setNovo] = useState<NovoCliente | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const s = <K extends keyof Form>(k: K, v: Form[K]) => setF({ ...f, [k]: v });

  const total = sumItens(f.itens, f.desconto);
  const primeiroServ = data.servicos.find((x) => x.id === f.itens.find((i) => i.servicoId)?.servicoId);
  const autoCor = primeiroServ?.cor || "verde";
  const autoDur =
    [...new Set(f.itens.map((i) => i.servicoId).filter(Boolean))].reduce((a, id) => a + (data.servicos.find((x) => x.id === id)?.duracaoMin || 0), 0) || 120;

  async function salvar() {
    const itens = f.itens.filter((i) => i.servicoId);
    if (!novo && !f.clienteId) return setErr("Escolha o cliente.");
    if (novo && !novo.nome.trim()) return setErr("Informe o nome do novo cliente.");
    if (!itens.length) return setErr("Adicione pelo menos um serviço.");
    if (semValor(itens)) return setErr("Informe o valor de cada serviço.");
    if (!f.data) return setErr("Informe a data.");
    setErr("");
    setBusy(true);
    try {
      const clienteId = await run(() => ensureCliente(f.clienteId, novo));
      const pagamento = { ...f.pagamento };
      if (pagamento.status === "pago" && !pagamento.pagoEm) pagamento.pagoEm = today();
      const concluidaEm = f.status === "concluida" && !f.concluidaEm ? today() : f.concluidaEm;
      const osId = await run(
        () =>
          saveOS(os?.id, {
            clienteId, data: f.data, hora: f.hora, duracao: Number(f.duracao) || autoDur, status: f.status,
            desconto: Number(f.desconto) || 0, total, cor: f.cor || autoCor, obs: f.obs, funcionarioIds: f.funcionarioIds,
            itens, pagamento, concluidaEm, contratoId: f.contratoId, nf: os?.nf ?? NF_VAZIA,
          }),
        os ? "OS atualizada" : "OS criada",
      );
      if (retorno) await setRetorno(retorno.clienteId, retorno.servicoId, retorno.osId, "agendado").catch(() => {});
      void osId;
      closeM();
    } catch {
      setBusy(false);
    }
  }

  return (
    <Sheet
      title={os ? "Editar " + numOS(os.numero) : "Nova ordem de serviço"}
      footer={
        <>
          <button className="btn" onClick={closeM}>Cancelar</button>
          <button className="btn pri" disabled={busy} onClick={salvar}>{busy ? "Salvando…" : "Salvar OS"}</button>
        </>
      }
    >
      <div className="f">
        <ClientePicker value={f.clienteId} set={(v) => s("clienteId", v)} novo={novo} setNovo={setNovo} />
        <div className="fr">
          <Field label="Data"><input id="os-data" type="date" value={f.data} onChange={(e) => s("data", e.target.value)} /></Field>
          <Field label="Horário"><input id="os-hora" type="time" value={f.hora} onChange={(e) => s("hora", e.target.value)} /></Field>
          <Field label="Duração (min)">
            <input id="os-dur" type="number" inputMode="numeric" min="15" step="15" placeholder={String(autoDur)} value={f.duracao || ""} onChange={(e) => s("duracao", e.target.value === "" ? "" : +e.target.value)} />
          </Field>
          <Field label="Status">
            <select id="os-st" value={f.status} onChange={(e) => s("status", e.target.value as StatusOS)}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
        <ItemsEditor itens={f.itens} set={(v) => s("itens", v)} />
        <FuncPicker ids={f.funcionarioIds} set={(v) => s("funcionarioIds", v)} />
        <div className="fset">
          <span className="lbl">Cor na agenda</span>
          <Swatches id="os-cor" value={f.cor || autoCor} set={(v) => s("cor", v)} />
          <span className="hint">{f.cor ? "Cor escolhida para esta OS." : "Usando a cor do serviço. Toque para escolher outra."}</span>
        </div>
        <div className="fr">
          <Field label="Desconto (R$)">
            <input id="os-desc" type="number" inputMode="decimal" min="0" step="0.01" value={f.desconto} onChange={(e) => s("desconto", e.target.value === "" ? "" : +e.target.value)} />
          </Field>
          <Field label="Forma de pagamento">
            <select id="os-forma" value={f.pagamento.forma} onChange={(e) => s("pagamento", { ...f.pagamento, forma: e.target.value })}><FormasOptions /></select>
          </Field>
          <Field label="Pagamento">
            <select
              id="os-pg"
              value={f.pagamento.status}
              onChange={(e) => {
                const status = e.target.value as Pagamento["status"];
                s("pagamento", { ...f.pagamento, status, pagoEm: status === "pago" ? f.pagamento.pagoEm || today() : null });
              }}
            >
              <option value="pendente">A receber</option>
              <option value="pago">Pago</option>
            </select>
          </Field>
        </div>
        <Field label="Observações">
          <textarea id="os-obs" placeholder="Ex.: sofá retrátil 3 lugares, mancha de café no assento" value={f.obs} onChange={(e) => s("obs", e.target.value)} />
        </Field>
        <div className="tot"><span>Total</span><b>{brl(total)}</b></div>
        {err && <div className="note">{err}</div>}
      </div>
    </Sheet>
  );
}
