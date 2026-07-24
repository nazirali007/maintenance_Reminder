"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};

export function SidebarLogo() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const src = mounted && resolvedTheme === "light" ? "/LightModeLogo.png" : "/DarkModeLogo.png";

  return <img src={src} alt="" className="h-8 w-8 rounded-md object-contain" />;
}
