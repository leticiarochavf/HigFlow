import { redirect } from "next/navigation";
import { DataProvider } from "@/features/data/data-provider";
import { AppShell } from "@/features/shell/app-shell";
import { UIProvider } from "@/features/ui/ui-provider";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <UIProvider>
      <DataProvider>
        <AppShell>{children}</AppShell>
      </DataProvider>
    </UIProvider>
  );
}
