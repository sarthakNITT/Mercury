"use client";

import { SidebarNav, adminNavItems } from "@/components/layout/admin-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-8 md:flex-row md:gap-12 py-8 container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Mobile Sidebar Trigger */}
      <div className="md:hidden flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px]">
            <div className="py-4">
              <h2 className="mb-4 text-lg font-semibold tracking-tight px-2">
                Admin Console
              </h2>
              <SidebarNav
                items={adminNavItems}
                onClick={() => setOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold">Admin Menu</h1>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[240px] shrink-0 border-r border-border/40 pr-6">
        <div className="sticky top-24 space-y-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Console
            </h2>
            <SidebarNav items={adminNavItems} />
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 w-full overflow-hidden">{children}</main>
    </div>
  );
}
