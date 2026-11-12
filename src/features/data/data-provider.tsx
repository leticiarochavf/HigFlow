"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { Item, Me, Perfil } from "@/types/domain";
import { setRefreshHook, type DataKey } from "./actions";
import { computeDerived, EMPTY_DATA, resolveRole, type Data, type Derived, type Role } from "./derived";
import {
  toCliente, toComissao, toContrato, toDespesa, toFuncionario, toItem, toNota, toOS, toPedido, toRetorno, toServico,
} from "./mappers";

type Status = "loading" | "ready" | "error";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/** Lê uma tabela inteira, em páginas de 1000 (limite padrão do Supabase). */
async function all(table: string, order: string[]): Promise<Row[]> {
  const sb = getSupabase();
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select("*");
    for (const o of order) q = q.order(o);
    const { data, error } = await q.range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data as Row[]));
    if (data.length < 1000) break;
  }
  return out;
}

const LOADERS: Record<DataKey, () => Promise<Partial<Data>>> = {
  servicos: async () => ({ servicos: (await all("servicos", ["id"])).map(toServico) }),
  clientes: async () => ({ clientes: (await all("clientes", ["id"])).map(toCliente) }),
  funcionarios: async () => ({ funcionarios: (await all("funcionarios", ["id"])).map(toFuncionario) }),
  contratos: async () => ({ contratos: (await all("contratos", ["id"])).map(toContrato) }),
  despesas: async () => ({ despesas: (await all("despesas", ["id"])).map(toDespesa) }),
  notas: async () => ({ notas: (await all("os_notas", ["id"])).map(toNota) }),
  retornos: async () => ({ retornos: (await all("retornos", ["cliente_id", "servico_id", "os_id"])).map(toRetorno) }),
  comissoes: async () => ({ comissoes: (await all("comissoes", ["funcionario_id", "mes"])).map(toComissao) }),
  pedidos: async () => ({ pedidos: (await all("pedidos_acesso", ["user_id"])).map(toPedido) }),
  os: async () => {
    const [os, itens] = await Promise.all([all("ordens_servico", ["id"]), all("os_itens", ["os_id", "ordem", "id"])]);
    const porOS = new Map<string, Item[]>();
    for (const r of itens) {
      const lista = porOS.get(r.os_id) ?? [];
      lista.push(toItem(r));
      porOS.set(r.os_id, lista);
    }
    return { os: os.map((r) => toOS(r, porOS.get(r.id) ?? [])) };
  },
};

const ALL_KEYS = Object.keys(LOADERS) as DataKey[];

const TABLE_KEY: Record<string, DataKey> = {
  servicos: "servicos", clientes: "clientes", funcionarios: "funcionarios", ordens_servico: "os", os_itens: "os",
  os_notas: "notas", contratos: "contratos", despesas: "despesas", retornos: "retornos", comissoes: "comissoes",
  pedidos_acesso: "pedidos",
};

type Ctx = {
  status: Status;
  slow: boolean;
  me: Me | null;
  data: Data;
  d: Derived;
  role: Role;
  profiles: Record<string, Perfil>;
  asFunc: string | null;
  verComo: (id: string | null) => void;
  refresh: (keys?: DataKey[]) => Promise<void>;
  signOut: () => Promise<void>;
};

const DataCtx = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [slow, setSlow] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<Data>(EMPTY_DATA);
  const [profiles, setProfiles] = useState<Record<string, Perfil>>({});
  const [asFunc, setAsFunc] = useState<string | null>(null);

  const refresh = useCallback(async (keys: DataKey[] = ALL_KEYS) => {
    const partes = await Promise.all([...new Set(keys)].map((k) => LOADERS[k]()));
    setData((prev) => Object.assign({}, prev, ...partes) as Data);
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    setRefreshHook(refresh);
    const sb = getSupabase();
    let vivo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pendentes = new Set<DataKey>();
    const agendar = (k: DataKey) => {
      pendentes.add(k);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const ks = [...pendentes];
        pendentes.clear();
        refresh(ks).catch(console.error);
      }, 250);
    };
    const canal = sb.channel("higflow");
    for (const t of Object.keys(TABLE_KEY)) {
      canal.on("postgres_changes", { event: "*", schema: "public", table: t }, () => agendar(TABLE_KEY[t]));
    }
    const voltou = () => { if (document.visibilityState === "visible") refresh().catch(console.error) };

    (async () => {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) { window.location.href = "/login"; return }
      const { data: isOwner } = await sb.rpc("is_owner");
      if (!vivo) return;
      setMe({
        id: auth.user.id, email: auth.user.email ?? null,
        name: (auth.user.user_metadata?.name as string) || "", isOwner: !!isOwner,
      });
      const lento = setTimeout(() => setSlow(true), 10000);
      try {
        await refresh();
        if (vivo) setStatus("ready");
      } catch (e) {
        console.error(e);
        if (vivo) setStatus("error");
      } finally {
        clearTimeout(lento);
        setSlow(false);
      }
      canal.subscribe();
      document.addEventListener("visibilitychange", voltou);
      addEventListener("online", voltou);
    })();

    return () => {
      vivo = false;
      clearTimeout(timer);
      sb.removeChannel(canal);
      document.removeEventListener("visibilitychange", voltou);
      removeEventListener("online", voltou);
    };
  }, [refresh]);

  const d = useMemo(() => computeDerived(data), [data]);
  const role = useMemo(() => resolveRole(me, data.funcionarios, asFunc), [me, data.funcionarios, asFunc]);

  // nomes das contas que pediram acesso (só o administrador consegue ler os perfis)
  useEffect(() => {
    const ids = data.pedidos.map((p) => p.userId);
    if (!ids.length || role.r !== "admin") return;
    getSupabase()
      .from("profiles")
      .select("id,name,email")
      .in("id", ids)
      .then(({ data: rows }: { data: Array<{ id: string; name: string | null; email: string | null }> | null }) => {
        setProfiles(Object.fromEntries((rows ?? []).map((r) => [r.id, { name: r.name, email: r.email }])));
      });
  }, [data.pedidos, role.r]);

  const value = useMemo<Ctx>(
    () => ({ status, slow, me, data, d, role, profiles, asFunc, verComo: setAsFunc, refresh, signOut }),
    [status, slow, me, data, d, role, profiles, asFunc, refresh, signOut],
  );
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData(): Ctx {
  const c = useContext(DataCtx);
  if (!c) throw new Error("useData fora do DataProvider");
  return c;
}
