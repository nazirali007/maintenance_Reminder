import { auth } from "@/auth";
import { getUnreadNotifications } from "@/lib/server/notifications";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chat/chat-widget";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Only reads here. The due-status sync used to run from this layout, which
  // meant every navigation in the group — including /settings, which shows no
  // vehicle data at all — spent ~5 extra queries recomputing reminders. It now
  // runs on the dashboard (where that status is actually surfaced) and is
  // triggered directly by the mutations that can change it.
  const notifications = session?.user?.id
    ? await getUnreadNotifications(session.user.id)
    : [];

  return (
    <div className="flex flex-1 md:h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col md:h-dvh md:overflow-y-auto">
        <Navbar
          user={{
            name: session?.user?.name,
            email: session?.user?.email,
            image: session?.user?.image,
          }}
          notifications={notifications}
        />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        <Footer />
      </div>
      <ChatWidget />
    </div>
  );
}
