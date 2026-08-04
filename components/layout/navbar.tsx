"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { MenuIcon, LogOutIcon, MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle, useThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarLogo } from "@/components/layout/sidebar-logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  NotificationBell,
  NotificationMenuItems,
  type NotificationItem,
} from "@/components/layout/notification-bell";

interface NavbarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function Navbar({
  user,
  notifications,
}: {
  user: NavbarUser;
  notifications: NotificationItem[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mounted, isDark, toggle } = useThemeToggle();
  const initials = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();
  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-3">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden" />}
        >
          <MenuIcon />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SidebarLogo />
              CarSalhakar
            </SheetTitle>
          </SheetHeader>
          <div className="px-4">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <span className="absolute left-1/2 -translate-x-1/2 text-base font-semibold md:hidden">
        CarSalhakar
      </span>

      <div className="hidden flex-1 md:block" />

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 md:flex">
          <NotificationBell notifications={notifications} />
          <ThemeToggle />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="gap-2 px-2" />}
          >
            <Avatar size="sm">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="truncate text-sm font-medium">{user.name ?? "Account"}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <div className="md:hidden">
              <Accordion>
                <AccordionItem value="notifications" className="border-none">
                  <AccordionTrigger className="rounded-md px-1.5 py-1 text-sm font-normal hover:no-underline data-panel-open:bg-accent data-panel-open:text-accent-foreground">
                   
                    <span className="flex items-center gap-1.5">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <NotificationMenuItems notifications={notifications} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              {mounted && (
                <DropdownMenuItem onClick={toggle}>
                  {isDark ? <SunIcon /> : <MoonIcon />}
                  {isDark ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </div>

            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
