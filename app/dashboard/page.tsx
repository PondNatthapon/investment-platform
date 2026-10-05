import { HoldingsTable } from "@/components/holdings-table";
import { PortfolioChart } from "@/components/portfolio-chart";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentAccount } from "@/lib/account/context";
import { getPortfolioValuation } from "@/lib/portfolio/service";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    accountId?: string;
  }>;
}) {
  const params = await searchParams;

  const user = await getCurrentUser();

  const account = await getCurrentAccount(
    user.id,
    params.accountId,
  );

  const positions = await getPortfolioValuation(
    user.id,
    account.id,
  );

  const totalCurrentValue = positions.reduce(
    (sum, position) =>
      sum + Number(position.currentValue),
    0,
  );

  const totalUnrealizedPnl = positions.reduce(
    (sum, position) =>
      sum + Number(position.unrealizedPnl),
    0,
  );

  const totalCostBasis = positions.reduce(
    (sum, position) =>
      sum + Number(position.costBasis),
    0,
  );

  const totalRealizedPnl = positions.reduce(
    (sum, position) =>
      sum + Number(position.realizedPnl),
    0,
  );

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-medium text-zinc-400">
            {account.broker}
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {account.name}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Portfolio Dashboard · {account.baseCurrency}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Current Value"
            value={`$${totalCurrentValue.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
              },
            )}`}
            description="Current market value"
          />

          <StatCard
            label="Cost Basis"
            value={`$${totalCostBasis.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
              },
            )}`}
            description="Total recorded investment cost"
          />

          <StatCard
            label="Unrealized P/L"
            value={`$${totalUnrealizedPnl.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
              },
            )}`}
            description={
              totalUnrealizedPnl >= 0
                ? "Unrealized profit"
                : "Unrealized loss"
            }
            trend={
              totalUnrealizedPnl >= 0
                ? "positive"
                : "negative"
            }
          />

          <StatCard
            label="Realized P/L"
            value={`$${totalRealizedPnl.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
              },
            )}`}
            description={
              totalRealizedPnl >= 0
                ? "Realized profit"
                : "Realized loss"
            }
            trend={
              totalRealizedPnl >= 0
                ? "positive"
                : "negative"
            }
          />
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-6">
            <SectionHeader
              title="Cost Basis Allocation"
              description="Allocation based on recorded transaction cost."
            />
          </div>

          <PortfolioChart positions={positions} />
        </section>

        <section className="space-y-5">
          <SectionHeader
            title="Holdings"
            description={`${positions.length} active securities`}
          />

          <HoldingsTable positions={positions} />
        </section>
      </div>
    </main>
  );
}
