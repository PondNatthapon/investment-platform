"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createTransaction } from "@/lib/transaction/service";
import { createTransactionSchema } from "@/lib/transaction/schema";

const DEMO_USER_ID =
  "806d7566-d20d-4a1c-8ca4-42b636b26852";

export type TransactionActionState = {
  error?: string;
};

export async function addTransaction(
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const rawInput = {
    accountId: formData.get("accountId"),
    securityId: formData.get("securityId"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    price: formData.get("price"),
    fee: formData.get("fee"),
    transactionAt: formData.get("transactionAt"),
    notes: formData.get("notes"),
  };

  const parsed = createTransactionSchema.safeParse(
    rawInput,
  );

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ??
        "Invalid transaction data.",
    };
  }

  try {
    await createTransaction(
      DEMO_USER_ID,
      parsed.data,
    );
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create transaction.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");

  redirect("/dashboard/transactions?created=1");
}
