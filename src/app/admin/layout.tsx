import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "RAD CRM", template: "%s | RAD CRM" },
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: LayoutProps<"/admin">) {
  return <>{children}</>;
}
