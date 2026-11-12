// Modelo de domínio usado pelas telas (camelCase). O banco usa snake_case:
// a conversão fica em src/features/data/mappers.ts.

export type Unidade = "un" | "lugar" | "m2" | "peca" | "h";
export type StatusOS = "agendada" | "em_andamento" | "concluida" | "cancelada";
export type StatusPg = "pendente" | "pago";
export type Frequencia = "semanal" | "quinzenal" | "mensal" | "bimestral" | "trimestral";
export type Papel = "funcionario" | "admin";
export type StatusRetorno = "pendente" | "contatado" | "agendado" | "dispensado";

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  bairro: string;
  cidade: string;
  mapsUrl: string;
  obs: string;
  criadoEm: string;
};

export type Servico = {
  id: string;
  nome: string;
  unidade: Unidade;
  retornoMeses: number;
  duracaoMin: number;
  cor: string;
  ativo: boolean;
};

export type Funcionario = {
  id: string;
  nome: string;
  telefone: string;
  funcao: string;
  admissao: string;
  comissaoTipo: "pct" | "fixo";
  comissaoValor: number;
  papel: Papel;
  ativo: boolean;
  userId: string | null;
};

export type Item = {
  servicoId: string;
  nome: string;
  qtd: number | "";
  preco: number | "";
  unidade: string;
};

export type Pagamento = { forma: string; status: StatusPg; pagoEm: string | null };

/** Nota fiscal cadastrada na OS. `numero` vazio = sem NF. */
export type Nf = { numero: string; serie: string; emissao: string | null; link: string };

export type OS = {
  id: string;
  numero: number;
  clienteId: string;
  data: string;
  hora: string;
  duracao: number | null;
  status: StatusOS;
  desconto: number;
  total: number;
  cor: string | null;
  obs: string;
  funcionarioIds: string[];
  itens: Item[];
  pagamento: Pagamento;
  nf: Nf;
  concluidaEm: string | null;
  contratoId: string | null;
  criadoEm: string;
};

export type Contrato = {
  id: string;
  clienteId: string;
  frequencia: Frequencia;
  proximaData: string;
  hora: string;
  forma: string;
  obs: string;
  ativo: boolean;
  itens: Item[];
  funcionarioIds: string[];
  total: number;
};

export type Despesa = {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
};

export type Nota = {
  id: string;
  osId: string;
  texto: string;
  em: string;
  funcionarioId: string | null;
  origem: string;
};

export type RetornoSalvo = {
  clienteId: string;
  servicoId: string;
  osId: string;
  status: Exclude<StatusRetorno, "pendente">;
  em: string;
};

export type Comissao = { funcionarioId: string; mes: string; valor: number; pagoEm: string };

export type Pedido = { userId: string; nome: string; telefone: string; em: string };

export type Perfil = { name: string | null; email: string | null };

/** Retorno calculado: lembrete de nova higienização de um cliente. */
export type Retorno = {
  id: string;
  clienteId: string;
  servicoId: string;
  servico: string;
  osId: string;
  base: string;
  due: string;
  meses: number;
  status: StatusRetorno;
};

export type Me = {
  id: string | null;
  email: string | null;
  name: string;
  isOwner: boolean;
};
