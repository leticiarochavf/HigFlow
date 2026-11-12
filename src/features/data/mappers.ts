import type {
  Cliente, Comissao, Contrato, Despesa, Funcionario, Item, Nota, OS, Pedido, RetornoSalvo, Servico,
} from "@/types/domain";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const hhmm = (s: string | null | undefined) => (s ? String(s).slice(0, 5) : "");

export const toCliente = (r: Row): Cliente => ({
  id: r.id, nome: r.nome, telefone: r.telefone, endereco: r.endereco, bairro: r.bairro,
  cidade: r.cidade, mapsUrl: r.maps_url, obs: r.obs, criadoEm: r.created_at,
});

export const toServico = (r: Row): Servico => ({
  id: r.id, nome: r.nome, unidade: r.unidade, retornoMeses: r.retorno_meses,
  duracaoMin: r.duracao_min, cor: r.cor, ativo: r.ativo,
});

export const toFuncionario = (r: Row): Funcionario => ({
  id: r.id, nome: r.nome, telefone: r.telefone, funcao: r.funcao, admissao: r.admissao || "",
  comissaoTipo: r.comissao_tipo, comissaoValor: Number(r.comissao_valor), papel: r.papel,
  ativo: r.ativo, userId: r.user_id,
});

export const toItem = (r: Row): Item => ({
  servicoId: r.servico_id || "", nome: r.nome, qtd: Number(r.qtd), preco: Number(r.preco), unidade: r.unidade,
});

export const toOS = (r: Row, itens: Item[]): OS => ({
  id: r.id, numero: r.numero, clienteId: r.cliente_id, data: r.data, hora: hhmm(r.hora),
  duracao: r.duracao, status: r.status, desconto: Number(r.desconto), total: Number(r.total),
  cor: r.cor, obs: r.obs, funcionarioIds: r.funcionario_ids || [], itens,
  pagamento: { forma: r.pagamento_forma, status: r.pagamento_status, pagoEm: r.pago_em },
  nf: { numero: r.nf_numero || "", serie: r.nf_serie || "", emissao: r.nf_emissao || null, link: r.nf_link || "" },
  concluidaEm: r.concluida_em, contratoId: r.contrato_id, criadoEm: r.created_at,
});

export const toContrato = (r: Row): Contrato => ({
  id: r.id, clienteId: r.cliente_id, frequencia: r.frequencia, proximaData: r.proxima_data,
  hora: hhmm(r.hora), forma: r.forma, obs: r.obs, ativo: r.ativo,
  itens: ((r.itens as Row[]) || []).map((i) => ({
    servicoId: i.servico_id || "", nome: i.nome, qtd: Number(i.qtd), preco: Number(i.preco), unidade: i.unidade || "un",
  })),
  funcionarioIds: r.funcionario_ids || [], total: Number(r.total),
});

export const toDespesa = (r: Row): Despesa => ({
  id: r.id, descricao: r.descricao, categoria: r.categoria, valor: Number(r.valor), data: r.data,
});

export const toNota = (r: Row): Nota => ({
  id: r.id, osId: r.os_id, texto: r.texto, em: r.em, funcionarioId: r.funcionario_id, origem: r.origem,
});

export const toRetorno = (r: Row): RetornoSalvo => ({
  clienteId: r.cliente_id, servicoId: r.servico_id, osId: r.os_id, status: r.status, em: r.em,
});

export const toComissao = (r: Row): Comissao => ({
  funcionarioId: r.funcionario_id, mes: r.mes, valor: Number(r.valor), pagoEm: r.pago_em,
});

export const toPedido = (r: Row): Pedido => ({ userId: r.user_id, nome: r.nome, telefone: r.telefone, em: r.em });

/* ---------- domínio -> banco ---------- */
export const fromItens = (itens: Item[]) =>
  itens.map((i) => ({
    servico_id: i.servicoId || null, nome: i.nome, qtd: Number(i.qtd) || 0, preco: Number(i.preco) || 0, unidade: i.unidade || "un",
  }));
