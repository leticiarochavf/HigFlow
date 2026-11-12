"use client";

import type { ComponentType } from "react";
import { ClienteForm } from "@/features/clientes/cliente-form";
import { ClienteView } from "@/features/clientes/cliente-view";
import { FuncForm } from "@/features/equipe/func-form";
import { Vincular } from "@/features/equipe/vincular";
import { DespForm } from "@/features/financeiro/desp-form";
import { OSForm } from "@/features/os/os-form";
import { OSView } from "@/features/os/os-view";
import { ContratoForm } from "@/features/recorrencia/contrato-form";
import { MaisSheet } from "@/features/shell/app-shell";
import { ServForm } from "@/features/servicos/serv-form";
import { useUI, type ModalKind } from "./ui-provider";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODALS: Record<ModalKind, ComponentType<any>> = {
  osView: OSView, osForm: OSForm, cliForm: ClienteForm, cliView: ClienteView, contratoForm: ContratoForm,
  despForm: DespForm, funcForm: FuncForm, servForm: ServForm, vincular: Vincular, mais: MaisSheet,
};

export function ModalHost() {
  const { modal } = useUI();
  if (!modal) return null;
  const C = MODALS[modal.kind];
  const id = typeof modal.props.id === "string" ? modal.props.id : "";
  return <C key={modal.kind + id} {...modal.props} />;
}
