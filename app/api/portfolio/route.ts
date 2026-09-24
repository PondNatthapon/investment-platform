import { NextResponse } from "next/server";

import { getPortfolioValuation } from "@/lib/portfolio/service";

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

  try {
    const portfolio = await getPortfolioValuation(accountId);

    return NextResponse.json({
      accountId,
      positions: portfolio,
    });
  } catch (error) {
    console.error("Failed to load portfolio:", error);

    return NextResponse.json(
      {
        error: "Failed to load portfolio",
      },
      { status: 500 },
    );
  }
}
