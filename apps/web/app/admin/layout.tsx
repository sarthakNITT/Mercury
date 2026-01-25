import { SidebarNav, adminNavItems } from "@/components/layout/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 py-6">
      <aside className="-mx-4 lg:w-1/5">
        <SidebarNav items={adminNavItems} />
      </aside>
      <div className="flex-1 lg:max-w-4xl">{children}</div>
    </div>
  );
}
