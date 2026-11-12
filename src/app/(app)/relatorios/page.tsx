import { Suspense } from "react";
import { RelatorioPage } from "@/features/relatorios/relatorio-page";

export default function Page() {
  return (
    <Suspense>
      <RelatorioPage />
    </Suspense>
  );
}
