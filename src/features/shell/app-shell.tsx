"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactElement, type ReactNode } from "react";
import { BrandStack, Mark, Wordmark } from "@/components/brand";
import { I } from "@/components/icons";
import { Sheet, Toasts } from "@/components/ui";
import { Pending } from "@/features/auth/pending";
import { useData } from "@/features/data/data-provider";
import { ModalHost } from "@/features/ui/modal-host";
import { useUI } from "@/features/ui/ui-provider";
import { EMPRESA } from "@/lib/format";

type NavItem = [href: string, label: string, icon: ReactElement];

const NAV_ADMIN: NavItem[] = [
  ["/painel", "Painel", I.home], ["/os", "OS", I.os], ["/clientes", "Clientes", I.users],
  ["/recorrencia", "Recorrência", I.repeat], ["/financeiro", "Financeiro", I.cash],
  ["/indicadores", "Indicadores", I.chart], ["/relatorios", "Relatórios", I.doc], ["/equipe", "Equipe", I.team], ["/servicos", "Serviços", I.tag],
];
const NAV_FUNC: NavItem[] = [["/agenda", "Minha agenda", I.cal], ["/comissoes", "Comissões", I.coin]];
const FUNC_PATHS = NAV_FUNC.map((n) => n[0]);
const MAIS_PATHS = NAV_ADMIN.slice(5).map((n) => n[0]);

const Msg = ({ t, children }: { t: string; children: ReactNode }) => (
  <div className="center">
    <div className="card">
      <BrandStack />
      {t !== "HigFlow" && <h1>{t}</h1>}
      {children}
    </div>
  </div>
);

export function VerComo({ id = "ver-como" }: { id?: string }) {
  const { data, verComo } = useData();
  const router = useRouter();
  const { closeM } = useUI();
  const fs = data.funcionarios.filter((f) => f.ativo);
  if (!fs.length) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <label className="fl" style={{ fontSize: ".78rem" }}>
        Ver como técnico
        <select id={id} value="" onChange={(e) => { if (e.target.value) { verComo(e.target.value); closeM(); router.push("/agenda") } }}>
          <option value="">Escolha…</option>
          {fs.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </label>
    </div>
  );
}

export function MaisSheet() {
  const { closeM } = useUI();
  const { signOut } = useData();
  const router = useRouter();
  return (
    <Sheet title="Mais">
      <VerComo />
      <button className="btn sm" style={{ marginTop: 8, width: "100%" }} onClick={signOut}>Sair</button>
      <div className="card list" style={{ marginTop: 12 }}>
        {NAV_ADMIN.slice(5).map(([href, label, icn]) => (
          <button key={href} className="row" onClick={() => { closeM(); router.push(href) }}>
            <span style={{ width: 22, color: "var(--green)" }}>{icn}</span>
            <div className="main"><div className="t">{label}</div></div>
            {I.right}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { status, slow, role, me, verComo, signOut } = useData();
  const pathname = usePathname();
  const router = useRouter();
  const { openM } = useUI();

  const fora =
    (role.r === "func" && !FUNC_PATHS.includes(pathname)) || (role.r === "admin" && FUNC_PATHS.includes(pathname));
  useEffect(() => {
    if (status !== "ready" || !fora) return;
    router.replace(role.r === "func" ? "/agenda" : "/painel");
  }, [status, fora, role.r, router]);

  if (status === "loading") {
    return (
      <Msg t="HigFlow">
        <p className="muted" style={{ margin: 0 }}>
          {slow ? "Os dados estão demorando para chegar. Confira a internet; a tela atualiza sozinha." : "Carregando agenda, clientes e financeiro…"}
        </p>
      </Msg>
    );
  }
  if (status === "error") {
    return (
      <Msg t="Sem acesso aos dados">
        <p className="muted" style={{ margin: 0 }}>Não foi possível ler os dados. Confira a conexão e tente de novo, ou peça acesso ao administrador.</p>
        <button className="btn" onClick={() => window.location.reload()}>Tentar de novo</button>
      </Msg>
    );
  }
  if (role.r === "none") {
    return <Msg t="Conta não identificada"><p className="muted" style={{ margin: 0 }}>Entre com sua conta para usar o sistema.</p></Msg>;
  }
  if (role.r === "pending") return <><Pending /><Toasts /></>;
  if (fora) return null;

  const nav = role.r === "admin" ? NAV_ADMIN : NAV_FUNC;
  const mob: NavItem[] = role.r === "admin" ? [...NAV_ADMIN.slice(0, 5), ["__mais", "Mais", I.more]] : nav;
  const preview = role.r === "func" && role.preview;

  return (
    <>
      {preview && role.r === "func" && (
        <div className="banner" style={{ borderRadius: 0, justifyContent: "center", paddingBlock: 8, position: "sticky", top: "env(safe-area-inset-top,0px)", zIndex: 30 }}>
          <span>Você está vendo o app como <b style={{ display: "inline" }}>{role.f.nome}</b> (técnico).</span>
          <button className="btn sm pri" onClick={() => { verComo(null); router.push("/painel") }}>Voltar ao admin</button>
        </div>
      )}
      <div className="app">
        <aside className="side">
          <div className="brand">
            <Mark w={54} sw={7} />
            <div>
              <Wordmark h={22} />
              <small style={{ marginTop: 3 }}>{EMPRESA}</small>
            </div>
          </div>
          {nav.map(([href, label, icn]) => (
            <Link key={href} href={href} className="nav-a" aria-current={pathname === href ? "page" : undefined}>{icn} {label}</Link>
          ))}
          <div className="who">
            <b>{role.f?.nome || (me?.isOwner ? "Proprietário" : "Administrador")}</b>
            <div className="muted">{role.r === "admin" ? "Administrador" : "Funcionário"}</div>
            {slow && <div className="muted" style={{ marginTop: 6 }}>Dados podem estar desatualizados.</div>}
            {role.r === "admin" && <VerComo id="ver-como-side" />}
            {preview && <button className="btn sm" style={{ marginTop: 8, width: "100%" }} onClick={() => { verComo(null); router.push("/painel") }}>Voltar ao admin</button>}
            <button className="btn sm" style={{ marginTop: 8, width: "100%" }} onClick={signOut}>Sair</button>
          </div>
        </aside>
        <main>
          <div className="wrap">{children}</div>
        </main>
        <nav className="bnav" aria-label="Navegação">
          {mob.map(([href, label, icn]) => (
            <button
              key={href}
              aria-current={pathname === href || (href === "__mais" && MAIS_PATHS.includes(pathname)) ? "page" : undefined}
              onClick={() => (href === "__mais" ? openM("mais") : router.push(href))}
            >
              {icn}<span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
      <ModalHost />
      <Toasts />
    </>
  );
}
