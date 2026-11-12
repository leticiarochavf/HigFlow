-- Nota fiscal cadastrada na OS (número, série, data de emissão e link opcional do PDF/XML).
-- Só adiciona colunas: o código publicado antes desta migração continua funcionando.

alter table public.ordens_servico
  add column if not exists nf_numero  text not null default '',
  add column if not exists nf_serie   text not null default '',
  add column if not exists nf_emissao date,
  add column if not exists nf_link    text not null default '';

-- salvar_os passa a aceitar os campos da NF. Se a chave não vier no JSON, o valor atual é mantido.
create or replace function public.salvar_os(p_id uuid, p_os jsonb, p_itens jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid := p_id;
  v_func uuid[] := coalesce(array(select jsonb_array_elements_text(p_os->'funcionario_ids'))::uuid[], '{}');
begin
  if not public.is_admin() then raise exception 'sem permissao' using errcode = '42501'; end if;

  if v_id is null then
    insert into public.ordens_servico (
      cliente_id, data, hora, duracao, status, desconto, total, cor, obs, funcionario_ids,
      pagamento_forma, pagamento_status, pago_em, concluida_em, contrato_id,
      nf_numero, nf_serie, nf_emissao, nf_link)
    values (
      (p_os->>'cliente_id')::uuid, (p_os->>'data')::date, nullif(p_os->>'hora', '')::time,
      nullif(p_os->>'duracao', '')::int, coalesce(p_os->>'status', 'agendada'),
      coalesce((p_os->>'desconto')::numeric, 0), coalesce((p_os->>'total')::numeric, 0),
      nullif(p_os->>'cor', ''), coalesce(p_os->>'obs', ''), v_func,
      coalesce(p_os->>'pagamento_forma', 'pix'), coalesce(p_os->>'pagamento_status', 'pendente'),
      nullif(p_os->>'pago_em', '')::date, nullif(p_os->>'concluida_em', '')::date,
      nullif(p_os->>'contrato_id', '')::uuid,
      coalesce(p_os->>'nf_numero', ''), coalesce(p_os->>'nf_serie', ''),
      nullif(p_os->>'nf_emissao', '')::date, coalesce(p_os->>'nf_link', ''))
    returning id into v_id;
  else
    update public.ordens_servico set
      cliente_id = (p_os->>'cliente_id')::uuid,
      data = (p_os->>'data')::date,
      hora = nullif(p_os->>'hora', '')::time,
      duracao = nullif(p_os->>'duracao', '')::int,
      status = coalesce(p_os->>'status', status),
      desconto = coalesce((p_os->>'desconto')::numeric, 0),
      total = coalesce((p_os->>'total')::numeric, 0),
      cor = nullif(p_os->>'cor', ''),
      obs = coalesce(p_os->>'obs', ''),
      funcionario_ids = v_func,
      pagamento_forma = coalesce(p_os->>'pagamento_forma', pagamento_forma),
      pagamento_status = coalesce(p_os->>'pagamento_status', pagamento_status),
      pago_em = nullif(p_os->>'pago_em', '')::date,
      concluida_em = nullif(p_os->>'concluida_em', '')::date,
      nf_numero  = case when p_os ? 'nf_numero'  then coalesce(p_os->>'nf_numero', '')  else nf_numero  end,
      nf_serie   = case when p_os ? 'nf_serie'   then coalesce(p_os->>'nf_serie', '')   else nf_serie   end,
      nf_emissao = case when p_os ? 'nf_emissao' then nullif(p_os->>'nf_emissao', '')::date else nf_emissao end,
      nf_link    = case when p_os ? 'nf_link'    then coalesce(p_os->>'nf_link', '')    else nf_link    end
    where id = v_id;
    if not found then raise exception 'OS nao encontrada' using errcode = 'P0002'; end if;
  end if;

  delete from public.os_itens where os_id = v_id;
  insert into public.os_itens (os_id, servico_id, nome, qtd, preco, unidade, ordem)
  select v_id, nullif(t.i->>'servico_id', '')::uuid, t.i->>'nome',
         coalesce((t.i->>'qtd')::numeric, 1), coalesce((t.i->>'preco')::numeric, 0),
         coalesce(t.i->>'unidade', 'un'), t.ord::int
  from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) with ordinality as t(i, ord);

  return v_id;
end $$;
