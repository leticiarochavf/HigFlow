# HigFlow

Sistema web de ordens de serviço, agenda, clientes, recorrência, financeiro e equipe da **LavCri**.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Supabase** (Postgres, Auth, Realtime) com RLS em todas as tabelas
- **Tailwind 4** (utilitários) + `src/app/design.css` (design system HigFlow)

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

Variáveis em `.env.local` (modelo em `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # chave publishable
```

Outros comandos: `npm run build`, `npm run start`, `npm run typecheck`.

## Recursos

- **Serviços**: catálogo sem preço (nome, unidade, duração e tempo de retorno). O valor é digitado em cada OS.
- **OS**: agenda do dia, lista, pesquisa por serviço e filtro "Concluídas sem NF".
- **Nota fiscal**: número, série, data de emissão e link opcional do PDF/XML, cadastrados dentro da OS.
- **Relatórios** (`/relatorios`): OS por serviço, com quantidade feita, clientes atendidos e lista das OS. Filtra por serviço, período e status; imprime e exporta CSV.
- **Clientes**: contagem e exportação em CSV (nome, telefone, endereço, bairro, cidade, link do Maps e observações).

## Primeiro acesso

O **primeiro cadastro** vira proprietário (administrador total). Crie a sua conta antes de passar o endereço
para qualquer outra pessoa. Quem se cadastrar depois cai na tela "Pedir acesso" e o administrador libera
em **Equipe → Pedidos de acesso**, escolhendo se é funcionário (só a própria agenda e comissões) ou administrador.

> O Supabase pede confirmação por e-mail no cadastro por padrão. Para testar sem isso:
> Authentication → Providers → Email → desligar "Confirm email".

## Estrutura

```
src/
  app/                 rotas: /login e (app)/painel, os, clientes, recorrencia, financeiro,
                       indicadores, equipe, servicos, agenda, comissoes
  components/          ícones, marca, blocos de interface (modal, selos, campos)
  features/
    data/              provedor de dados (Supabase + tempo real), ações de gravação, cálculos
    os/ clientes/ recorrencia/ financeiro/ dashboard/ equipe/ servicos/ tecnico/ painel/
    shell/ ui/ auth/   menu, modais e avisos, login
  lib/                 formatação, datas, mapas/WhatsApp; clientes Supabase (browser, server, middleware)
  types/domain.ts      tipos do domínio
supabase/migrations/   modelo do banco (tabelas, RLS, funções)
legacy/                versão original em HTML único (referência)
```

## Banco de dados

Migrações em `supabase/migrations/`, já aplicadas no projeto `higflow-lavcri`:

| Tabela | O que guarda |
| --- | --- |
| `clientes`, `servicos`, `funcionarios` | cadastros |
| `ordens_servico`, `os_itens`, `os_notas` | OS, itens (preço do momento) e anotações |
| `contratos` | visitas recorrentes (a função `gerar_os_contratos` cria as OS) |
| `despesas`, `comissoes`, `retornos` | financeiro e lembretes de retorno |
| `pedidos_acesso`, `owners`, `profiles` | acesso e usuários |

Permissões (RLS): quem tem acesso lê tudo; o administrador escreve em tudo; o técnico só altera o status e o
pagamento das OS e cria anotações. Um gatilho no banco impede o técnico de mexer em outros campos da OS.

Funções: `salvar_os` (OS + itens na mesma transação), `gerar_os_contratos`, `is_owner`, `is_admin`, `has_access`.

## Ainda não feito

- Migração dos dados que estavam no artefato do Claude (o sistema começa vazio).
- Validação de formulários com `zod`, como no Rose Imports.
- Testes automatizados e deploy na Vercel.
