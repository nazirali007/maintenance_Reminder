import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarLogo } from "@/components/layout/sidebar-logo";

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r border-border p-4 md:flex">
      <div className="flex items-center gap-2 px-3">
        <SidebarLogo />
        <span className="text-lg font-semibold">Maintenance Reminder</span>
      </div>
      <SidebarNav />
    </aside>
  );
}
