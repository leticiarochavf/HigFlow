type Cell = string | number | null | undefined;

/** Evita que o Excel trate texto digitado pelo usuário como fórmula (=, +, -, @). */
const seguro = (s: string) => (/^[=+\-@\t\r]/.test(s) ? "'" + s : s);

function celula(v: Cell): string {
  const s = seguro(String(v ?? ""));
  return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** CSV com ponto e vírgula (padrão do Excel em português) e BOM para os acentos abrirem certo. */
export function toCsv(linhas: Cell[][]): string {
  return "﻿" + linhas.map((l) => l.map(celula).join(";")).join("\r\n");
}

export function baixarCsv(nomeArquivo: string, linhas: Cell[][]) {
  const blob = new Blob([toCsv(linhas)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
