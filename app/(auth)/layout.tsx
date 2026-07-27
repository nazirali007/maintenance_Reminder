import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/project_loginBG.webp')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/55 to-background/85" />

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
