import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r border-border p-4 md:flex">
      <span className="px-3 text-lg font-semibold">Maintenance Reminder</span>
      <img
        src="/BrandLogo.svg"
        alt="Maintenance Reminder"
        className="h-12 w-12 rounded-md"
      />
      <SidebarNav />
    </aside>
  );
}
