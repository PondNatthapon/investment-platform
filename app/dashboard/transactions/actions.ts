"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createTransactionSchema } from "@/lib/transaction/schema";
import { createTransaction } from "@/lib/transaction/service";

export type TransactionActionState = {
  error?: string;
};

export async function createTransactionAction(
  _prevState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const parsed = createTransactionSchema.safeParse({
    accountId: formData.get("accountId"),
    securityId: formData.get("securityId"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    price: formData.get("price"),
    fee: formData.get("fee") || "0",
    transactionAt: formData.get("transactionAt"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid transaction data.",
    };
  }

  try {
    const user = await getCurrentUser();

    await createTransaction(user.id, parsed.data);
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