import * as z from "zod";

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Must be a valid positive number.");

export const createTransactionSchema = z.object({
  accountId: z.uuid(),
  securityId: z.uuid(),
  type: z.enum(["BUY", "SELL"]),

  quantity: decimalString,
  price: decimalString,

  fee: decimalString.optional().default("0"),

  transactionAt: z
    .string()
    .trim()
    .min(1, "Transaction date is required."),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes are too long.")
    .optional()
    .default(""),
});

export type CreateTransactionInput = z.infer<
  typeof createTransactionSchema
>;