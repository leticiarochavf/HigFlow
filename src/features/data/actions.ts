import { getSupabase } from "@/lib/supabase/client";
import { today } from "@/lib/format";
import type { Cliente, Contrato, Despesa, Funcionario, Item, Nf, OS, Pagamento, Servico, StatusOS, StatusRetorno } from "@/types/domain";
import { fromItens } from "./mappers";

/** Tabelas (grupos) que a tela mantém em memória. */
export type DataKey =
  | "servicos" | "clientes" | "funcionarios" | "os" | "notas" | "contratos"
  | "despesas" | "retornos" | "comissoes" | "pedidos";

let refreshHook: (keys: DataKey[]) => Promise<void> = async () => {};
export const setRefreshHook = (fn: (keys: DataKey[]) => Promise<void>) => { refreshHook = fn };

/** Erro do Supabase com o código original (42501 = sem permissão). */
export class DbError extends Error {
  code?: string;
  constructor(message: string, code?: string) { super(message); this.code = code }
}

const sb = () => getSupabase();
async function ok<T>(p: PromiseLike<{ data: T; error: { message: string; code?: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new DbError(error.message, error.code);
  return data;
}
async function mut<T>(keys: DataKey[], fn: () => PromiseLike<T>): Promise<T> {
  const r = await fn();
  await refreshHook(keys);
  return r;
}

/* ---------- clientes ---------- */
export const saveCliente = (id: string | undefined, c: Partial<Cliente>) =>
  mut(["clientes"], async () => {
    const row = {
      nome: String(c.nome || "").trim(), telefone: c.telefone || "", endereco: c.endereco || "", bairro: c.bairro || "",
      cidade: c.cidade || "", maps_url: c.mapsUrl || "", obs: c.obs || "",
    };
    if (id) { await ok(sb().from("clientes").update(row).eq("id", id)); return id }
    const d = await ok(sb().from("clientes").insert(row).select("id").single());
    return (d as { id: string }).id;
  });
export const deleteCliente = (id: string) => mut(["clientes"], () => ok(sb().from("clientes").delete().eq("id", id)));

/* ---------- serviços ---------- */
export const saveServico = (id: string | undefined, s: Partial<Servico>) =>
  mut(["servicos"], async () => {
    const row = {
      nome: String(s.nome || "").trim(), unidade: s.unidade || "un",
      retorno_meses: Number(s.retornoMeses) || 0, duracao_min: Number(s.duracaoMin) || 120, cor: s.cor || "verde", ativo: s.ativo !== false,
    };
    await ok(id ? sb().from("servicos").update(row).eq("id", id) : sb().from("servicos").insert(row));
  });
export const deleteServico = (id: string) => mut(["servicos"], () => ok(sb().from("servicos").delete().eq("id", id)));
export const seedServicos = (base: Array<[string, string, number, string]>) =>
  mut(["servicos"], () =>
    ok(sb().from("servicos").insert(base.map(([nome, unidade, retorno_meses, cor]) => ({ nome, unidade, retorno_meses, cor, duracao_min: 120, ativo: true })))),
  );

/* ---------- funcionários e acesso ---------- */
export const saveFuncionario = (id: string | undefined, f: Partial<Funcionario>) =>
  mut(["funcionarios"], async () => {
    const row = {
      nome: String(f.nome || "").trim(), telefone: f.telefone || "", funcao: f.funcao || "", admissao: f.admissao || null,
      comissao_tipo: f.comissaoTipo || "pct", comissao_valor: Number(f.comissaoValor) || 0,
      papel: f.papel || "funcionario", ativo: f.ativo !== false, user_id: f.userId || null,
    };
    await ok(id ? sb().from("funcionarios").update(row).eq("id", id) : sb().from("funcionarios").insert(row));
  });
export const deleteFuncionario = (id: string) => mut(["funcionarios"], () => ok(sb().from("funcionarios").delete().eq("id", id)));

/** Libera o acesso de um pedido: liga a conta a uma ficha existente ou cria uma nova. */
export const liberarAcesso = (userId: string, fichaId: string | "__novo", papel: "funcionario" | "admin", nome: string, telefone: string) =>
  mut(["funcionarios", "pedidos"], async () => {
    if (fichaId === "__novo") {
      await ok(sb().from("funcionarios").insert({ nome: nome || "Novo funcionário", telefone, papel, user_id: userId }));
    } else {
      await ok(sb().from("funcionarios").update({ user_id: userId, papel }).eq("id", fichaId));
    }
    await ok(sb().from("pedidos_acesso").delete().eq("user_id", userId));
  });
export const recusarPedido = (userId: string) => mut(["pedidos"], () => ok(sb().from("pedidos_acesso").delete().eq("user_id", userId)));
export const pedirAcesso = (userId: string, nome: string, telefone: string) =>
  mut(["pedidos"], () => ok(sb().from("pedidos_acesso").upsert({ user_id: userId, nome, telefone, em: today() })));

/* ---------- despesas e comissões ---------- */
export const saveDespesa = (id: string | undefined, d: Partial<Despesa>) =>
  mut(["despesas"], async () => {
    const row = { descricao: String(d.descricao || "").trim(), categoria: d.categoria || "Outros", valor: Number(d.valor) || 0, data: d.data || today() };
    await ok(id ? sb().from("despesas").update(row).eq("id", id) : sb().from("despesas").insert(row));
  });
export const deleteDespesa = (id: string) => mut(["despesas"], () => ok(sb().from("despesas").delete().eq("id", id)));
export const pagarComissao = (funcionarioId: string, mes: string, valor: number) =>
  mut(["comissoes"], () => ok(sb().from("comissoes").upsert({ funcionario_id: funcionarioId, mes, valor, pago_em: today() })));

/* ---------- contratos ---------- */
export const saveContrato = (id: string | undefined, c: Omit<Contrato, "id">) =>
  mut(["contratos"], async () => {
    const row = {
      cliente_id: c.clienteId, frequencia: c.frequencia, proxima_data: c.proximaData, hora: c.hora || null, forma: c.forma,
      obs: c.obs || "", ativo: c.ativo, itens: fromItens(c.itens), funcionario_ids: c.funcionarioIds, total: c.total,
    };
    await ok(id ? sb().from("contratos").update(row).eq("id", id) : sb().from("contratos").insert(row));
  });
export const deleteContrato = (id: string) => mut(["contratos"], () => ok(sb().from("contratos").delete().eq("id", id)));
/** Gera as OS dos contratos com visita nos próximos 7 dias. Devolve quantas foram criadas. */
export const gerarContratos = () => mut(["os", "contratos"], () => ok(sb().rpc("gerar_os_contratos")) as PromiseLike<number>);

/* ---------- ordens de serviço ---------- */
export type OSInput = Omit<OS, "id" | "numero" | "criadoEm" | "itens"> & { itens: Item[] };

export const saveOS = (id: string | undefined, o: OSInput) =>
  mut(["os"], async () => {
    const payload = {
      cliente_id: o.clienteId, data: o.data, hora: o.hora || "", duracao: o.duracao, status: o.status, desconto: Number(o.desconto) || 0,
      total: o.total, cor: o.cor || "", obs: o.obs || "", funcionario_ids: o.funcionarioIds,
      pagamento_forma: o.pagamento.forma, pagamento_status: o.pagamento.status, pago_em: o.pagamento.pagoEm || "",
      concluida_em: o.concluidaEm || "", contrato_id: o.contratoId || "",
      nf_numero: o.nf.numero, nf_serie: o.nf.serie, nf_emissao: o.nf.emissao || "", nf_link: o.nf.link,
    };
    return ok(sb().rpc("salvar_os", { p_id: id ?? null, p_os: payload, p_itens: fromItens(o.itens) })) as PromiseLike<string>;
  });

export type OSPatch = { status?: StatusOS; concluidaEm?: string | null; pagamento?: Partial<Pagamento>; cor?: string; nf?: Nf };
export const patchOS = (id: string, p: OSPatch) =>
  mut(["os"], async () => {
    const row: Record<string, unknown> = {};
    if (p.status !== undefined) row.status = p.status;
    if (p.concluidaEm !== undefined) row.concluida_em = p.concluidaEm;
    if (p.cor !== undefined) row.cor = p.cor;
    if (p.nf) {
      row.nf_numero = p.nf.numero.trim();
      row.nf_serie = p.nf.serie.trim();
      row.nf_emissao = p.nf.emissao || null;
      row.nf_link = p.nf.link.trim();
    }
    if (p.pagamento) {
      if (p.pagamento.forma !== undefined) row.pagamento_forma = p.pagamento.forma;
      if (p.pagamento.status !== undefined) row.pagamento_status = p.pagamento.status;
      if (p.pagamento.pagoEm !== undefined) row.pago_em = p.pagamento.pagoEm;
    }
    await ok(sb().from("ordens_servico").update(row).eq("id", id));
  });
export const deleteOS = (id: string) => mut(["os"], () => ok(sb().from("ordens_servico").delete().eq("id", id)));

export const addNota = (osId: string, texto: string, funcionarioId: string | null) =>
  mut(["notas"], () => ok(sb().from("os_notas").insert({ os_id: osId, texto, funcionario_id: funcionarioId, origem: "app" })));

/* ---------- retornos ---------- */
export const setRetorno = (clienteId: string, servicoId: string, osId: string, status: Exclude<StatusRetorno, "pendente">) =>
  mut(["retornos"], () => ok(sb().from("retornos").upsert({ cliente_id: clienteId, servico_id: servicoId, os_id: osId, status, em: today() })));
export const clearRetorno = (clienteId: string, servicoId: string, osId: string) =>
  mut(["retornos"], () => ok(sb().from("retornos").delete().eq("cliente_id", clienteId).eq("servico_id", servicoId).eq("os_id", osId)));
