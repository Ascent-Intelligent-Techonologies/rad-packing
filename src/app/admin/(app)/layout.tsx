import { Suspense } from "react";
import { AuthedShell, ShellSkeleton } from "@/components/crm/Shell";

export default function AppLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AuthedShell>{children}</AuthedShell>
    </Suspense>
  );
}
