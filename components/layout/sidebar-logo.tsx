"use client";

import Image from "next/image";

import { useThemeToggle } from "@/components/theme-toggle";

export function SidebarLogo() {
  const { mounted, isDark } = useThemeToggle();

  return (
    <Image
      src={mounted && isDark ? "/Vector-darkOG.png" : "/vectorOG.png"}
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 rounded-md object-contain"
    />
  );
}
