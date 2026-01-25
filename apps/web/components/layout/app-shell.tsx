"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans">
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
