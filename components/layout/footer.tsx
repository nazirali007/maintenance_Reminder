import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-4 py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p>© {year} Maintenance Reminder. All rights reserved.</p>
        <nav className="flex items-center gap-4">
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <a
            href="mailto:support@example.com"
            className="hover:text-foreground"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
