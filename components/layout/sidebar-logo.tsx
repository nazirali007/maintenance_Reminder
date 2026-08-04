import Image from "next/image";

export function SidebarLogo() {
  return (
    <Image
      src="/Main-logo.png"
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 rounded-md object-contain"
    />
  );
}
