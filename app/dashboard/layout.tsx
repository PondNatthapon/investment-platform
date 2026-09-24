import Link from "next/link";
import {
  BarChart3,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  WalletCards,
} from "lucide-react";

import { getAccountsForUser } from "@/lib/account/service";
import { AccountSelector } from "@/components/account-selector";
import { Suspense } from "react";

const DEMO_USER_ID =
  "806d7566-d20d-4a1c-8ca4-42b636b26852";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "Portfolio",
    href: "#",
    icon: WalletCards,
    soon: true,
  },
  {
    label: "Transactions",
    href: "#",
    icon: Receipt,
    soon: true,
  },
  {
    label: "Dividends",
    href: "#",
    icon: BarChart3,
    soon: true,
  },
  {
    label: "Documents",
    href: "#",
    icon: FileText,
    soon: true,
  },
];

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const accounts = await getAccountsForUser(DEMO_USER_ID);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-white/8 bg-[#0c0c0f] lg:flex lg:flex-col">
          <div className="border-b border-white/8 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-black">
                IP
              </div>

              <div>
                <p className="text-sm font-semibold tracking-tight">
                  Investment
                </p>

                <p className="text-xs text-zinc-500">
                  Platform
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
              Workspace
            </p>

            {navigation.map((item) => {
              const Icon = item.icon;

              if (item.soon) {
                return (
                  <div
                    key={item.label}
                    className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600"
                  >
                    <Icon size={18} />

                    <span className="flex-1">
                      {item.label}
                    </span>

                    <span className="text-[10px] uppercase tracking-wider text-zinc-700">
                      Soon
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl bg-white/7 px-3 py-2.5 text-sm font-medium text-white"
                >
                  <Icon size={18} />

                  <span className="flex-1">
                    {item.label}
                  </span>

                  <ChevronRight size={15} className="text-zinc-500" />
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/8 p-3">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500">
              <Settings size={18} />
              <span>Settings</span>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/8 bg-[#09090b]/85 backdrop-blur-xl">
            <div className="flex min-h-18 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border border-white/8 bg-white/5 lg:hidden">
                  <Building2 size={17} />
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Account
                  </p>

                  <p className="text-sm font-medium text-zinc-200">
                    Investment workspace
                  </p>
                </div>
              </div>

              <div className="w-60 max-w-[48%] sm:w-72">
                <Suspense
                  fallback={
                    <div className="h-10 w-full animate-pulse rounded-xl border border-white/10 bg-white/5" />
                  }
                >
                  <AccountSelector accounts={accounts} />
                </Suspense>
              </div>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
