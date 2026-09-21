"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Position = {
  symbol: string;
  costBasis: string;
};

const COLORS = [
  "#60a5fa",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f87171",
];

export function PortfolioChart({
  positions,
}: {
  positions: Position[];
}) {
  const data = positions.map((position) => ({
    name: position.symbol,
    value: Number(position.costBasis),
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={80}
            outerRadius={115}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) =>
              `$${Number(value).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}`
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
