import Link from "next/link";

export function Header() {
  return (
    <header className="border-b bg-background px-4 py-3 md:px-6">
      <nav className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-foreground hover:text-foreground/90"
        >
          Mini Apps
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
        >
          Dashboard
        </Link>
      </nav>
    </header>
  );
}
