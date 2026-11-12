"use client";

import { I } from "@/components/icons";
import { Empty } from "@/components/ui";
import { recusarPedido } from "@/features/data/actions";
import { useData } from "@/features/data/data-provider";
import { useUI } from "@/features/ui/ui-provider";
import { brl, fmtDC } from "@/lib/format";

export function EquipePage() {
  const { data, profiles } = useData();
  const { openM, run } = useUI();
  const comAcesso = new Set(data.funcionarios.map((f) => f.userId).filter(Boolean));
  const pend = data.pedidos.filter((p) => !comAcesso.has(p.userId));
  const fs = [...data.funcionarios].sort((a, b) => Number(!a.ativo) - Number(!b.ativo) || a.nome.localeCompare(b.nome));

  return (
    <>
      <div className="topbar">
        <div><h1>Equipe</h1><div className="sub">Funcionários, comissões e acesso ao sistema</div></div>
        <button className="btn pri" onClick={() => openM("funcForm")}>{I.plus} Novo funcionário</button>
      </div>

      {pend.length > 0 && (
        <section className="sec">
          <h2>Pedidos de acesso ({pend.length})</h2>
          <div className="card list">
            {pend.map((a) => {
              const p = profiles[a.userId];
              return (
                <div key={a.userId} className="row" style={{ cursor: "default", flexWrap: "wrap" }}>
                  <div className="main">
                    <div className="t">{a.nome || p?.name || "Sem nome"}</div>
                    <div className="s">{p?.email ? p.email + " · " : ""}pediu em {fmtDC(a.em)}</div>
                  </div>
                  <div className="acts">
                    <button className="btn sm pri" onClick={() => openM("vincular", { a })}>Liberar acesso</button>
                    <button className="btn sm ghost" onClick={() => run(() => recusarPedido(a.userId), "Pedido recusado")}>Recusar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {fs.length ? (
        <div className="card list">
          {fs.map((f) => (
            <button key={f.id} className="row" onClick={() => openM("funcForm", { f })}>
              <div className="main">
                <div className="t">{f.nome}{!f.ativo && <> <span className="tag">Inativo</span></>}</div>
                <div className="s">{[f.funcao, f.telefone].filter(Boolean).join(" · ") || "—"}</div>
              </div>
              <div className="r">
                <span className="small" style={{ fontWeight: 600 }}>
                  {!f.comissaoValor ? "sem comissão" : f.comissaoTipo === "fixo" ? brl(f.comissaoValor) + "/OS" : f.comissaoValor + "%"}
                </span>
                <span className="tag">{f.userId ? (f.papel === "admin" ? "Acesso: administrador" : "Acesso: funcionário") : "Sem acesso ao sistema"}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card"><Empty title="Nenhum funcionário cadastrado" text="Cadastre a equipe para escalar nas OS e calcular comissões." /></div>
      )}

      <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        <h3>Como dar acesso a um funcionário</h3>
        <ol className="small muted" style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
          <li>Envie o endereço deste sistema para a pessoa.</li>
          <li>Ela cria uma conta com o e-mail dela, entra e toca em &quot;Pedir acesso&quot;.</li>
          <li>O pedido aparece aqui. Toque em &quot;Liberar acesso&quot; e escolha o cadastro dela.</li>
        </ol>
        <span className="small muted">Funcionários veem só a própria agenda e comissões. Administradores veem tudo.</span>
      </div>
    </>
  );
}
