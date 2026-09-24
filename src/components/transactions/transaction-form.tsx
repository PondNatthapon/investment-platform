"use client";

import { useActionState } from "react";

import {
  addTransaction,
  type TransactionActionState,
} from "@app/dashboard/transactions/actions";


type Security = {
  id: string;
  symbol: string;
  name: string;
  currency: string;
};

const initialState: TransactionActionState = {};

export function TransactionForm({
  accountId,
  securities,
}: {
  accountId: string;
  securities: Security[];
}) {
  const [state, formAction, isPending] =
    useActionState(
      addTransaction,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="space-y-5"
    >
      <input
        type="hidden"
        name="accountId"
        value={accountId}
      />

      <div>
        <label
          htmlFor="securityId"
          className="text-sm font-medium text-zinc-300"
        >
          Security
        </label>

        <select
          id="securityId"
          name="securityId"
          required
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-white/20"
        >
          <option value="">
            Select security
          </option>

          {securities.map((security) => (
            <option
              key={security.id}
              value={security.id}
            >
              {security.symbol} · {security.currency}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="type"
          className="text-sm font-medium text-zinc-300"
        >
          Transaction type
        </label>

        <select
          id="type"
          name="type"
          defaultValue="BUY"
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-white/20"
        >
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="quantity"
            className="text-sm font-medium text-zinc-300"
          >
            Quantity
          </label>

          <input
            id="quantity"
            name="quantity"
            type="text"
            inputMode="decimal"
            placeholder="0.000000"
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-white/20"
          />
        </div>

        <div>
          <label
            htmlFor="price"
            className="text-sm font-medium text-zinc-300"
          >
            Price
          </label>

          <input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-white/20"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="fee"
          className="text-sm font-medium text-zinc-300"
        >
          Fee
        </label>

        <input
          id="fee"
          name="fee"
          type="text"
          inputMode="decimal"
          defaultValue="0"
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-white/20"
        />
      </div>

      <div>
        <label
          htmlFor="transactionAt"
          className="text-sm font-medium text-zinc-300"
        >
          Date & time
        </label>

        <input
          id="transactionAt"
          name="transactionAt"
          type="datetime-local"
          required
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-white/20"
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="text-sm font-medium text-zinc-300"
        >
          Notes
        </label>

        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Optional"
          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-white/20"
        />
      </div>

      {state.error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-300"
        >
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending
          ? "Saving transaction..."
          : "Add transaction"}
      </button>

      <p className="text-xs leading-5 text-zinc-600">
        Gross amount is calculated on the server from
        quantity × price.
      </p>
    </form>
  );
}
