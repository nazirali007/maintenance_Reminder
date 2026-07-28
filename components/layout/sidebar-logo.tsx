"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";

const emptySubscribe = () => () => {};

export function SidebarLogo() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const src = mounted && resolvedTheme === "light" ? "/LightModeLogo.png" : "/DarkModeLogo.png";

  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 rounded-md object-contain"
    />
  );
}
