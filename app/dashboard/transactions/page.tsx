import { SectionHeader } from "@/components/ui/section-header";
import { TransactionForm } from "@/components/transactions/transaction-form";

import { getAccountsForUser } from "@/lib/account/service";
import { getTransactions } from "@/lib/transaction/service";

import { db } from "@/db";
import { securities } from "@/db/schema";

const DEMO_USER_ID =
  "806d7566-d20d-4a1c-8ca4-42b636b26852";

const DEFAULT_ACCOUNT_ID =
  "31e0cddc-5ef8-4c28-9c4a-8bf236bc41c7";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    accountId?: string;
    created?: string;
  }>;
}) {
  const params = await searchParams;

  const accounts =
    await getAccountsForUser(DEMO_USER_ID);

  const accountId =
    params.accountId ??
    accounts[0]?.id ??
    DEFAULT_ACCOUNT_ID;

  const [transactions, securitiesList] =
    await Promise.all([
      getTransactions(accountId),
      db.select().from(securities),
    ]);

  const selectedAccount =
    accounts.find(
      (account) => account.id === accountId,
    ) ?? accounts[0];

  if (!selectedAccount) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        No investment account found.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {params.created === "1" ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          Transaction added successfully.
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm text-zinc-500">
            {selectedAccount.name}
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Transactions
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Record and review investment activity.
          </p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-zinc-600">
            Account
          </p>

          <p className="mt-1 text-sm font-medium">
            {selectedAccount.broker}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 rounded-2xl border border-white/8 bg-white/[0.02]">
          <div className="border-b border-white/8 p-6">
            <SectionHeader
              title="Transaction history"
              description={`${transactions.length} recorded transactions`}
            />
          </div>

          <div className="divide-y divide-white/6">
            {transactions.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-zinc-300">
                  No transactions yet
                </p>
              </div>
            ) : (
              transactions.map((transaction) => {
                const isBuy =
                  transaction.type === "BUY";

                return (
                  <div
                    key={transaction.id}
                    className="grid gap-4 px-6 py-5 md:grid-cols-[1.3fr_0.8fr_1fr_1fr_auto]"
                  >
                    <div>
                      <p className="font-semibold">
                        {transaction.symbol}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {new Intl.DateTimeFormat(
                          "en-GB",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Asia/Bangkok",
                          },
                        ).format(
                          new Date(
                            transaction.transactionAt,
                          ),
                        )}
                      </p>
                    </div>

                    <div>
                      <span
                        className={
                          isBuy
                            ? "rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400"
                            : "rounded-md bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-400"
                        }
                      >
                        {transaction.type}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-300">
                        {transaction.quantity}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        shares
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-300">
                        {new Intl.NumberFormat(
                          "en-US",
                          {
                            style: "currency",
                            currency:
                              transaction.currency,
                          },
                        ).format(
                          Number(
                            transaction.grossAmount,
                          ),
                        )}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        @ {transaction.price}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat(
                          "en-US",
                          {
                            style: "currency",
                            currency:
                              transaction.currency,
                          },
                        ).format(
                          Number(transaction.fee),
                        )}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        fee
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="h-fit rounded-2xl border border-white/8 bg-white/[0.02] p-6">
          <SectionHeader
            title="Add transaction"
            description="Create a new BUY or SELL record."
          />

          <div className="mt-6">
            <TransactionForm
              accountId={accountId}
              securities={securitiesList}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
