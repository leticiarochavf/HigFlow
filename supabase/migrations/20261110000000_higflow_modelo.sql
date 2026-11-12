-- HigFlow (LavCri): modelo relacional.
-- Substitui a tabela genérica `docs` usada na primeira versão (estava vazia).

drop table if exists public.docs cascade;
drop table if exists public.locks cascade;
drop function if exists public.doc_update(text, text, jsonb);
drop function if exists public.acquire_lock(text, text, int);
drop function if exists public.is_admin() cascade;
drop function if exists public.has_access() cascade;

-- ---------- permissões (dependem de funcionarios, criada abaixo) ----------
create table public.servicos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  unidade       text not null default 'un' check (unidade in ('un','lugar','m2','peca','h')),
  preco         numeric(12,2) not null default 0 check (preco >= 0),
  retorno_meses int  not null default 0 check (retorno_meses >= 0),
  duracao_min   int  not null default 120 check (duracao_min > 0),
  cor           text not null default 'verde',
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.clientes (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text not null default '',
  endereco   text not null default '',
  bairro     text not null default '',
  cidade     text not null default '',
  maps_url   text not null default '',
  obs        text not null default '',
  created_at timestamptz not null default now()
);

create table public.funcionarios (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  telefone       text not null default '',
  funcao         text not null default 'Técnico de higienização',
  admissao       date,
  comissao_tipo  text not null default 'pct' check (comissao_tipo in ('pct','fixo')),
  comissao_valor numeric(12,2) not null default 0 check (comissao_valor >= 0),
  papel          text not null default 'funcionario' check (papel in ('funcionario','admin')),
  ativo          boolean not null default true,
  user_id        uuid unique references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_owner() or exists (
    select 1 from public.funcionarios
    where user_id = (select auth.uid()) and papel = 'admin' and ativo)
$$;

create or replace function public.has_access() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_owner() or exists (
    select 1 from public.funcionarios
    where user_id = (select auth.uid()) and ativo)
$$;

revoke execute on function public.is_admin(), public.has_access() from public, anon;
grant  execute on function public.is_admin(), public.has_access() to authenticated;

create table public.contratos (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid not null references public.clientes(id) on delete cascade,
  frequencia      text not null default 'mensal' check (frequencia in ('semanal','quinzenal','mensal','bimestral','trimestral')),
  proxima_data    date not null,
  hora            time,
  forma           text not null default 'pix',
  obs             text not null default '',
  ativo           boolean not null default true,
  itens           jsonb not null default '[]'::jsonb,   -- modelo dos itens de cada visita
  funcionario_ids uuid[] not null default '{}',
  total           numeric(12,2) not null default 0,
  created_at      timestamptz not null default now()
);

create sequence public.os_numero_seq;

create table public.ordens_servico (
  id                uuid primary key default gen_random_uuid(),
  numero            int  not null unique default nextval('public.os_numero_seq'),
  cliente_id        uuid not null references public.clientes(id) on delete restrict,
  data              date not null,
  hora              time,
  duracao           int check (duracao is null or duracao > 0),
  status            text not null default 'agendada' check (status in ('agendada','em_andamento','concluida','cancelada')),
  desconto          numeric(12,2) not null default 0 check (desconto >= 0),
  total             numeric(12,2) not null default 0,
  cor               text,
  obs               text not null default '',
  funcionario_ids   uuid[] not null default '{}',
  pagamento_forma   text not null default 'pix',
  pagamento_status  text not null default 'pendente' check (pagamento_status in ('pendente','pago')),
  pago_em           date,
  concluida_em      date,
  contrato_id       uuid references public.contratos(id) on delete set null,
  created_at        timestamptz not null default now()
);
alter sequence public.os_numero_seq owned by public.ordens_servico.numero;

create table public.os_itens (
  id         uuid primary key default gen_random_uuid(),
  os_id      uuid not null references public.ordens_servico(id) on delete cascade,
  servico_id uuid references public.servicos(id) on delete set null,
  nome       text not null,
  qtd        numeric(12,2) not null default 1 check (qtd >= 0),
  preco      numeric(12,2) not null default 0 check (preco >= 0),
  unidade    text not null default 'un',
  ordem      int not null default 0
);

create table public.os_notas (
  id             uuid primary key default gen_random_uuid(),
  os_id          uuid not null references public.ordens_servico(id) on delete cascade,
  texto          text not null,
  em             timestamptz not null default now(),
  funcionario_id uuid references public.funcionarios(id) on delete set null,
  origem         text not null default 'app'
);

create table public.despesas (
  id         uuid primary key default gen_random_uuid(),
  descricao  text not null,
  categoria  text not null default 'Outros',
  valor      numeric(12,2) not null check (valor > 0),
  data       date not null,
  created_at timestamptz not null default now()
);

create table public.retornos (
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  servico_id uuid not null references public.servicos(id) on delete cascade,
  os_id      uuid not null references public.ordens_servico(id) on delete cascade,
  status     text not null check (status in ('contatado','agendado','dispensado')),
  em         date not null default current_date,
  primary key (cliente_id, servico_id, os_id)
);

create table public.comissoes (
  funcionario_id uuid not null references public.funcionarios(id) on delete cascade,
  mes            text not null check (mes ~ '^[0-9]{4}-[0-9]{2}$'),
  valor          numeric(12,2) not null default 0,
  pago_em        date not null default current_date,
  primary key (funcionario_id, mes)
);

create table public.pedidos_acesso (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  nome     text not null,
  telefone text not null default '',
  em       date not null default current_date
);

create index on public.ordens_servico (data);
create index on public.ordens_servico (cliente_id);
create index on public.ordens_servico (status);
create index on public.os_itens (os_id);
create index on public.os_notas (os_id);
create index on public.despesas (data);
create index on public.contratos (cliente_id);
create index on public.retornos (os_id);
create index on public.retornos (servico_id);

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['servicos','clientes','funcionarios','contratos','ordens_servico','os_itens','os_notas','despesas','retornos','comissoes','pedidos_acesso'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
  -- leitura: qualquer pessoa com acesso; escrita: administrador
  foreach t in array array['servicos','clientes','funcionarios','contratos','ordens_servico','os_itens','os_notas','despesas','retornos','comissoes'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.has_access())', t || '_sel', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_adm', t);
  end loop;
end $$;

-- técnico pode atualizar OS (o gatilho abaixo limita as colunas) e escrever anotações
create policy os_func_upd on public.ordens_servico for update to authenticated
  using (public.has_access()) with check (public.has_access());
create policy os_notas_func_ins on public.os_notas for insert to authenticated
  with check (public.has_access());

-- pedidos de acesso: cada pessoa vê e cria o próprio; administrador vê e decide
create policy pedidos_sel on public.pedidos_acesso for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy pedidos_ins on public.pedidos_acesso for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy pedidos_upd on public.pedidos_acesso for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy pedidos_del on public.pedidos_acesso for delete to authenticated
  using (public.is_admin());

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

-- técnico só altera status e pagamento da OS; o resto é do administrador
create or replace function public.os_func_guard() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare livres text[] := array['status','pagamento_forma','pagamento_status','pago_em','concluida_em'];
begin
  if public.is_admin() then return new; end if;
  if (to_jsonb(new) - livres) is distinct from (to_jsonb(old) - livres) then
    raise exception 'sem permissao para alterar esta OS' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger os_func_guard before update on public.ordens_servico
  for each row execute function public.os_func_guard();

-- ---------- gera as OS dos contratos que vencem nos próximos dias ----------
create or replace function public.gerar_os_contratos(p_horizonte date default current_date + 7) returns int
language plpgsql security invoker set search_path = '' as $$
declare c record; dt date; n int := 0; v_os uuid;
begin
  if not public.is_admin() then raise exception 'sem permissao' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('gerar_os_contratos'));
  for c in select * from public.contratos where ativo and proxima_data <= p_horizonte order by proxima_data for update loop
    dt := c.proxima_data;
    while dt <= p_horizonte loop
      insert into public.ordens_servico (cliente_id, data, hora, funcionario_ids, desconto, total, status, pagamento_forma, pagamento_status, obs, contrato_id)
      values (c.cliente_id, dt, c.hora, c.funcionario_ids, 0, c.total, 'agendada', c.forma, 'pendente', c.obs, c.id)
      returning id into v_os;
      insert into public.os_itens (os_id, servico_id, nome, qtd, preco, unidade, ordem)
      select v_os, nullif(t.i->>'servico_id', '')::uuid, t.i->>'nome', coalesce((t.i->>'qtd')::numeric, 1),
             coalesce((t.i->>'preco')::numeric, 0), coalesce(t.i->>'unidade', 'un'), t.ord::int
      from jsonb_array_elements(c.itens) with ordinality as t(i, ord);
      n := n + 1;
      dt := case c.frequencia
        when 'semanal'   then dt + 7
        when 'quinzenal' then dt + 14
        when 'bimestral' then (dt + interval '2 months')::date
        when 'trimestral' then (dt + interval '3 months')::date
        else (dt + interval '1 month')::date end;
    end loop;
    update public.contratos set proxima_data = dt where id = c.id;
  end loop;
  return n;
end $$;

revoke execute on function public.gerar_os_contratos(date) from public, anon;
grant  execute on function public.gerar_os_contratos(date) to authenticated;

grant usage on sequence public.os_numero_seq to authenticated;

-- ---------- tempo real ----------
alter publication supabase_realtime add table
  public.servicos, public.clientes, public.funcionarios, public.contratos, public.ordens_servico,
  public.os_itens, public.os_notas, public.despesas, public.retornos, public.comissoes, public.pedidos_acesso;
