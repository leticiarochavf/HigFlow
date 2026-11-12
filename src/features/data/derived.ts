import { addDays, addMonths, today } from "@/lib/format";
import type {
  Cliente, Comissao, Contrato, Despesa, Funcionario, Nota, OS, Pedido, Retorno, RetornoSalvo, Servico,
} from "@/types/domain";

export type Data = {
  servicos: Servico[];
  clientes: Cliente[];
  funcionarios: Funcionario[];
  os: OS[];
  notas: Nota[];
  contratos: Contrato[];
  despesas: Despesa[];
  retornos: RetornoSalvo[];
  comissoes: Comissao[];
  pedidos: Pedido[];
};

export const EMPTY_DATA: Data = {
  servicos: [], clientes: [], funcionarios: [], os: [], notas: [], contratos: [],
  despesas: [], retornos: [], comissoes: [], pedidos: [],
};

export type Derived = {
  cli: Record<string, Cliente>;
  serv: Record<string, Servico>;
  func: Record<string, Funcionario>;
  os: OS[];
  retornos: Retorno[];
  retPend: Retorno[];
  contratosDue: Contrato[];
};

const byId = <T extends { id: string }>(a: T[]) => Object.fromEntries(a.map((o) => [o.id, o])) as Record<string, T>;

export function computeDerived(x: Data): Derived {
  const t = today();
  const cli = byId(x.clientes), serv = byId(x.servicos), func = byId(x.funcionarios);
  const os = [...x.os].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  // retornos: lembrete de nova higienização, calculado a partir da última OS concluída de cada cliente/serviço
  const salvo = new Map(x.retornos.map((r) => [`${r.clienteId}_${r.servicoId}_${r.osId}`, r]));
  const last: Record<string, { o: OS; nome: string; servicoId: string; m: number }> = {};
  const futuros: Record<string, string[]> = {};
  for (const o of os) {
    for (const it of o.itens) {
      const k = o.clienteId + "|" + it.servicoId;
      if (o.status === "concluida") {
        const m = serv[it.servicoId]?.retornoMeses || 0;
        if (m && (!last[k] || o.data > last[k].o.data)) last[k] = { o, nome: it.nome, servicoId: it.servicoId, m };
      }
      if (o.status === "agendada" || o.status === "em_andamento") (futuros[k] ||= []).push(o.data);
    }
  }
  const retornos: Retorno[] = Object.values(last)
    .filter((r) => cli[r.o.clienteId])
    .map(({ o, nome, servicoId, m }) => {
      const id = `${o.clienteId}_${servicoId}_${o.id}`;
      const st = salvo.get(id);
      const agendado = (futuros[o.clienteId + "|" + servicoId] || []).some((d) => d > o.data);
      return {
        id, clienteId: o.clienteId, servicoId, servico: serv[servicoId]?.nome || nome, osId: o.id, base: o.data,
        due: addMonths(o.data, m), meses: m, status: agendado ? "agendado" : st?.status || "pendente",
      } satisfies Retorno;
    })
    .sort((a, b) => a.due.localeCompare(b.due));

  const retPend = retornos.filter((r) => r.status === "pendente" && r.due <= addDays(t, 30));
  const contratosDue = x.contratos.filter((c) => c.ativo && c.proximaData && c.proximaData <= addDays(t, 7) && cli[c.clienteId]);
  return { cli, serv, func, os, retornos, retPend, contratosDue };
}

/** Comissão de um funcionário numa OS (divide o percentual entre a equipe). */
export function comissaoDe(o: OS, f: Funcionario | undefined): number {
  if (!f || !o.funcionarioIds.includes(f.id)) return 0;
  const v = f.comissaoValor || 0;
  if (!v) return 0;
  if (f.comissaoTipo === "fixo") return v;
  return ((o.total || 0) / (o.funcionarioIds.length || 1)) * v / 100;
}

export type Role =
  | { r: "admin"; f: Funcionario | null; preview?: false }
  | { r: "func"; f: Funcionario; preview?: boolean }
  | { r: "pending" }
  | { r: "none" };

export function resolveRole(
  me: { id: string | null; isOwner: boolean } | null,
  funcionarios: Funcionario[],
  asFunc: string | null,
): Role {
  if (!me?.id) return { r: "none" };
  const f = funcionarios.find((x) => x.userId === me.id && x.ativo) || null;
  const base: Role = me.isOwner ? { r: "admin", f } : f ? (f.papel === "admin" ? { r: "admin", f } : { r: "func", f }) : { r: "pending" };
  if (base.r === "admin" && asFunc) {
    const alvo = funcionarios.find((x) => x.id === asFunc);
    if (alvo) return { r: "func", f: alvo, preview: true };
  }
  return base;
}
