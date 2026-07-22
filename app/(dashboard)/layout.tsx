import { auth } from "@/auth";
import { syncOverdueNotifications, getUnreadNotifications } from "@/lib/notifications";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let notifications: { id: string; title: string; message: string }[] = [];
  if (session?.user?.id) {
    await syncOverdueNotifications(session.user.id);
    notifications = await getUnreadNotifications(session.user.id);
  }

  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar
          user={{
            name: session?.user?.name,
            email: session?.user?.email,
            image: session?.user?.image,
          }}
          notifications={notifications}
        />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
