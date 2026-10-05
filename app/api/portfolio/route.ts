import { NextResponse } from "next/server";

import { getPortfolioValuation } from "@/lib/portfolio/service";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  AccountAccessError,
  accountIdSchema,
} from "@/lib/account/access";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json(
      {
        error: "accountId is required",
      },
      { status: 400 },
    );
  }

  if (!accountIdSchema.safeParse(accountId).success) {
    return NextResponse.json(
      { error: "accountId must be a valid UUID" },
      { status: 400 },
    );
  }

  try {
    const user = await getCurrentUser();
    const portfolio = await getPortfolioValuation(user.id, accountId);

    return NextResponse.json({
      accountId,
      positions: portfolio,
    });
  } catch (error) {
    if (error instanceof AccountAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 },
      );
    }

    console.error("Failed to load portfolio:", error);

    return NextResponse.json(
      {
        error: "Failed to load portfolio",
      },
      { status: 500 },
    );
  }
}
