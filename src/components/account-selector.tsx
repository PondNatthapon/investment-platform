"use client";

import { ChevronDown } from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

type Account = {
  id: string;
  name: string;
  broker: string;
  baseCurrency: string;
  isActive: boolean;
};

export function AccountSelector({
  accounts,
}: {
  accounts: Account[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentAccountId =
    searchParams.get("accountId") ?? accounts[0]?.id ?? "";

  const currentAccount =
    accounts.find((account) => account.id === currentAccountId) ??
    accounts[0];

  function handleChange(accountId: string) {
    const params = new URLSearchParams(searchParams);

    params.set("accountId", accountId);

    router.replace(`${pathname}?${params.toString()}`);
  }

  if (!currentAccount) {
    return null;
  }

  return (
    <label className="relative block">
      <span className="sr-only">Select investment account</span>

      <select
        value={currentAccount.id}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm font-medium text-white outline-none transition hover:bg-white/10 focus:border-white/20 focus:ring-2 focus:ring-white/10"
      >
        {accounts.map((account) => (
          <option
            key={account.id}
            value={account.id}
            className="bg-zinc-900 text-white"
          >
            {account.name} · {account.broker}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
    </label>
  );
}
