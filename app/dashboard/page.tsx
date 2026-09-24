import { getPortfolio } from "@/lib/portfolio/service";
import { PortfolioChart } from "@/components/portfolio-chart";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    accountId?: string;
  }>;
}) {
  const params = await searchParams;

  const accountId =
    params.accountId ??
    "31e0cddc-5ef8-4c28-9c4a-8bf236bc41c7";

  const positions = await getPortfolio(accountId);

  const totalCostBasis = positions.reduce(
    (sum, position) => sum + Number(position.costBasis),
    0,
  );

  const totalRealizedPnl = positions.reduce(
    (sum, position) => sum + Number(position.realizedPnl),
    0,
  );

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-medium text-zinc-400">
            Investment Platform
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Portfolio Dashboard
          </h1>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Cost Basis"
            value={`$${totalCostBasis.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}`}
            description="Total recorded investment cost"
        />

          <StatCard
            label="Realized P/L"
            value={`$${totalRealizedPnl.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}`}
            description={
              totalRealizedPnl >= 0
                ? "Realized profit"
                : "Realized loss"
            }
            trend={totalRealizedPnl >= 0 ? "positive" : "negative"}
          />

          <StatCard
            label="Positions"
            value={positions.length.toString()}
            description="Active securities"
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

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 px-6 py-5">
            <h2 className="text-lg font-semibold">
              Holdings
            </h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-white/6">
            <div className="hidden grid-cols-5 border-b border-white/6 px-5 py-3 text-xs uppercase tracking-wider text-zinc-600 md:grid">
              <div>Security</div>
              <div>Shares</div>
              <div>Avg. Cost</div>
              <div>Cost Basis</div>
              <div>Realized P/L</div>
            </div>

            <div className="divide-y divide-white/6">
              {positions.map((position) => (
                <div
                  key={position.securityId}
                  className="grid gap-4 px-5 py-5 md:grid-cols-5 md:items-center"
                >
                  <div>
                    <p className="font-semibold text-zinc-100">
                      {position.symbol}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {position.currency}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-200">
                      {position.quantity}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-200">
                      ${position.averageCost}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      ${position.costBasis}
                    </p>
                  </div>

                  <div>
                    <p
                      className={
                        Number(position.realizedPnl) >= 0
                          ? "text-sm font-medium text-emerald-400"
                          : "text-sm font-medium text-rose-400"
                      }
                    >
                      ${position.realizedPnl}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}