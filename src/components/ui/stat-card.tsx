type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  trend?: "positive" | "negative" | "neutral";
};

const trendClasses = {
  positive: "text-emerald-400",
  negative: "text-rose-400",
  neutral: "text-zinc-400",
};

export function StatCard({
  label,
  value,
  description,
  trend = "neutral",
}: StatCardProps) {
  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
      <p className="text-sm text-zinc-500">{label}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
        {value}
      </p>

      {description ? (
        <p className={`mt-2 text-xs ${trendClasses[trend]}`}>
          {description}
        </p>
      ) : null}
    </section>
  );
}
