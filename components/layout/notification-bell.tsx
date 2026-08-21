"use client";

import { useRouter } from "next/navigation";
import { BellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
}

function useNotificationActions() {
  const router = useRouter();

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    router.refresh();
  }

  async function markAllAsRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    router.refresh();
  }

  return { markAsRead, markAllAsRead };
}

export function NotificationMenuItems({
  notifications,
  showTitle = true,
}: {
  notifications: NotificationItem[];
  showTitle?: boolean;
}) {
  const { markAsRead, markAllAsRead } = useNotificationActions();
  const unreadCount = notifications.length;
  const showHeaderRow = showTitle || unreadCount > 0;

  return (
    <>
      {showHeaderRow && (
        <>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between">
              {showTitle && <span>Notifications</span>}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="ml-auto text-xs font-normal text-muted-foreground underline underline-offset-4"
                >
                  Mark all as read
                </button>
              )}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>
      )}
      {notifications.length === 0 ? (
        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
          No new notifications
        </div>
      ) : (
        <Accordion className="px-1.5">
          {notifications.map((notification) => (
            <AccordionItem key={notification.id} value={notification.id}>
              <AccordionTrigger className="text-left hover:no-underline">
                {notification.title}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col items-start gap-2 pb-3">
                <p className="text-xs text-muted-foreground">
                  {notification.message}
                </p>
                {/* Dismissing is its own action now — the row itself expands
                    rather than marking read, so a stray click can't silently
                    clear a reminder the user hasn't read yet. */}
                <button
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  className="cursor-pointer text-xs font-medium text-primary underline underline-offset-4"
                >
                  Mark as read
                </button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </>
  );
}

export function NotificationBell({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const unreadCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <NotificationMenuItems notifications={notifications} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
