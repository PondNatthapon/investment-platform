import { getPortfolio } from "@/lib/portfolio/service";
import { PortfolioChart } from "@/components/portfolio-chart";

const DEMO_ACCOUNT_ID =
  "31e0cddc-5ef8-4c28-9c4a-8bf236bc41c7";

export default async function DashboardPage() {
  const positions = await getPortfolio(DEMO_ACCOUNT_ID);

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
          <SummaryCard
            label="Cost Basis"
            value={`$${totalCostBasis.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}`}
          />

          <SummaryCard
            label="Realized P/L"
            value={`$${totalRealizedPnl.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}`}
          />

          <SummaryCard
            label="Positions"
            value={positions.length.toString()}
          />
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Cost Basis Allocation
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Allocation based on recorded transaction cost.
            </p>
          </div>

          <PortfolioChart positions={positions} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 px-6 py-5">
            <h2 className="text-lg font-semibold">
              Holdings
            </h2>
          </div>

          <div className="divide-y divide-zinc-800">
            {positions.map((position) => (
              <div
                key={position.securityId}
                className="grid gap-4 px-6 py-5 md:grid-cols-5"
              >
                <div>
                  <p className="font-semibold">{position.symbol}</p>
                  <p className="text-xs text-zinc-500">
                    {position.currency}
                  </p>
                </div>

                <Metric
                  label="Shares"
                  value={position.quantity}
                />

                <Metric
                  label="Average Cost"
                  value={`$${position.averageCost}`}
                />

                <Metric
                  label="Cost Basis"
                  value={`$${position.costBasis}`}
                />

                <Metric
                  label="Realized P/L"
                  value={`$${position.realizedPnl}`}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <p className="text-sm text-zinc-400">{label}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
