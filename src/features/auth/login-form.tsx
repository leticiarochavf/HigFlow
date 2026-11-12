"use client";

import { useState, type FormEvent } from "react";
import { BrandStack } from "@/components/brand";
import { Field } from "@/components/ui";
import { getSupabase } from "@/lib/supabase/client";

function mensagem(e: unknown) {
  const m = String((e as Error)?.message || e || "");
  if (/invalid login/i.test(m)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(m)) return 'Este e-mail já tem conta. Use "Entrar".';
  if (/email.*invalid|invalid.*email/i.test(m)) return "Esse e-mail não é válido. Confira se digitou certo.";
  if (/email not confirmed/i.test(m)) return "Confirme seu e-mail pelo link que enviamos e tente de novo.";
  if (/at least 6|password/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/rate limit/i.test(m)) return "Muitas tentativas. Aguarde alguns minutos.";
  return "Não foi possível entrar. Confira os dados e a conexão.";
}

export function LoginForm() {
  const [modo, setModo] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setInfo("");
    setBusy(true);
    const sb = getSupabase();
    try {
      if (modo === "in") {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) throw error;
        window.location.href = "/";
      } else {
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password: senha, options: { data: { name: nome.trim() } } });
        if (error) throw error;
        if (data.session) window.location.href = "/";
        else setInfo("Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.");
      }
    } catch (x) {
      setErro(mensagem(x));
    }
    setBusy(false);
  }

  return (
    <div className="center">
      <form className="card" onSubmit={enviar}>
        <BrandStack />
        <h1>{modo === "in" ? "Entrar" : "Criar conta"}</h1>
        {modo === "up" && (
          <Field label="Seu nome">
            <input id="l-nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </Field>
        )}
        <Field label="E-mail">
          <input id="l-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Senha" hint={modo === "up" ? "Mínimo de 6 caracteres" : undefined}>
          <input id="l-senha" type="password" autoComplete={modo === "in" ? "current-password" : "new-password"} minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </Field>
        {erro && <div className="note">{erro}</div>}
        {info && <div className="banner"><span>{info}</span></div>}
        <button className="btn pri" type="submit" disabled={busy}>{modo === "in" ? "Entrar" : "Criar conta"}</button>
        <button className="btn ghost" type="button" onClick={() => { setModo(modo === "in" ? "up" : "in"); setErro(""); setInfo("") }}>
          {modo === "in" ? "Primeiro acesso? Criar conta" : "Já tenho conta. Entrar"}
        </button>
      </form>
    </div>
  );
}
