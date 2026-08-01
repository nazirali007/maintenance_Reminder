import Link from "next/link";
import type { Metadata } from "next";
import { GaugeIcon, BellIcon, WrenchIcon, MailIcon } from "lucide-react";

import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarLogo } from "@/components/layout/sidebar-logo";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Maintenance Reminder helps you track every vehicle's service history and reminds you before anything falls due.",
};

const FEATURES = [
  {
    icon: GaugeIcon,
    title: "Track every vehicle",
    description:
      "Add each car you own, log its odometer, and keep a running history of what's been serviced and when.",
  },
  {
    icon: WrenchIcon,
    title: "Never miss a service",
    description:
      "Set an interval (in km) or a time window for each maintenance item — oil, filters, brakes, tyres — and see at a glance what's due.",
  },
  {
    icon: BellIcon,
    title: "Estimated reminders by email",
    description:
      "Even if you haven't opened the app in weeks, we estimate your mileage from your driving history and email you before a service is likely overdue.",
  },
];

export default async function AboutPage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <SidebarLogo />
          <span className="text-lg font-semibold">Maintenance Reminder</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            nativeButton={false}
            render={<Link href={session?.user ? "/dashboard" : "/login"} />}
          >
            {session?.user ? "Go to Dashboard" : "Sign in"}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
        <div className="flex flex-col gap-4 text-center">
          <h1 className="text-3xl font-semibold">About Maintenance Reminder</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            A simple way to keep track of your vehicles&apos; maintenance — so a
            missed oil change or an overdue brake service never sneaks up on
            you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={20} />
              </div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center">
          <MailIcon size={20} className="text-muted-foreground" />
          <p className="font-medium">Questions or feedback?</p>
          <a
            href="mailto:thecarvault8@gmail.com"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            thecarvault8@gmail.com
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
