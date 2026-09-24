import {
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/format";

type Holding = {
  securityId: string;
  symbol: string;
  currency: string;
  quantity: string;
  averageCost: string;
  costBasis: string;
  currentPrice: string;
  currentValue: string;
  unrealizedPnl: string;
  returnPct: string | null;
};

export function HoldingsTable({
  positions,
}: {
  positions: Holding[];
}) {
  if (positions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
        <p className="text-sm font-medium text-zinc-300">
          No holdings yet
        </p>

        <p className="mt-1 text-sm text-zinc-500">
          Add a transaction to start tracking your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8">
      {/* Desktop header */}
      <div className="hidden grid-cols-[1.5fr_repeat(6,1fr)] gap-4 border-b border-white/6 bg-white/[0.02] px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-600 xl:grid">
        <div>Security</div>
        <div className="text-right">Shares</div>
        <div className="text-right">Avg. Cost</div>
        <div className="text-right">Price</div>
        <div className="text-right">Value</div>
        <div className="text-right">Unrealized</div>
        <div className="text-right">Return</div>
      </div>

      <div className="divide-y divide-white/6">
        {positions.map((position) => {
          const pnl = Number(position.unrealizedPnl);
          const positive = pnl >= 0;

          return (
            <div
              key={position.securityId}
              className="px-5 py-5 transition hover:bg-white/[0.02]"
            >
              {/* Desktop */}
              <div className="hidden grid-cols-[1.5fr_repeat(6,1fr)] items-center gap-4 xl:grid">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-100">
                    {position.symbol}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {position.currency}
                  </p>
                </div>

                <div className="text-right text-sm text-zinc-300">
                  {formatNumber(position.quantity)}
                </div>

                <div className="text-right text-sm text-zinc-300">
                  {formatCurrency(
                    position.averageCost,
                    position.currency,
                  )}
                </div>

                <div className="text-right text-sm text-zinc-300">
                  {formatCurrency(
                    position.currentPrice,
                    position.currency,
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-zinc-100">
                    {formatCurrency(
                      position.currentValue,
                      position.currency,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Cost{" "}
                    {formatCurrency(
                      position.costBasis,
                      position.currency,
                    )}
                  </p>
                </div>

                <div
                  className={`text-right text-sm font-medium ${
                    positive
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  <div className="inline-flex items-center gap-1">
                    {positive ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}

                    {formatCurrency(
                      position.unrealizedPnl,
                      position.currency,
                    )}
                  </div>
                </div>

                <div
                  className={`text-right text-sm font-medium ${
                    positive
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {formatPercent(position.returnPct)}
                </div>
              </div>

              {/* Mobile */}
              <div className="xl:hidden">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-zinc-100">
                      {position.symbol}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {formatNumber(position.quantity)} shares
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-zinc-100">
                      {formatCurrency(
                        position.currentValue,
                        position.currency,
                      )}
                    </p>

                    <p
                      className={`mt-1 text-xs font-medium ${
                        positive
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {formatPercent(position.returnPct)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                  <Metric
                    label="Average cost"
                    value={formatCurrency(
                      position.averageCost,
                      position.currency,
                    )}
                  />

                  <Metric
                    label="Current price"
                    value={formatCurrency(
                      position.currentPrice,
                      position.currency,
                    )}
                  />

                  <Metric
                    label="Cost basis"
                    value={formatCurrency(
                      position.costBasis,
                      position.currency,
                    )}
                  />

                  <Metric
                    label="Unrealized"
                    value={formatCurrency(
                      position.unrealizedPnl,
                      position.currency,
                    )}
                    valueClassName={
                      positive
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  valueClassName = "text-zinc-200",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-600">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-medium ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}