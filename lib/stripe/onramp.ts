/**
 * Stripe Crypto Onramp utilities
 */

export interface OnrampSessionResponse {
  clientSecret: string;
  sessionId: string;
  status: string;
  transactionDetails: {
    destinationCurrency: string;
    destinationNetwork: string;
    sourceCurrency: string;
    sourceAmount: string | null;
    walletAddress: string | null;
  };
}

export interface OnrampQuoteResponse {
  sourceAmount: string;
  sourceCurrency: string;
  quote: {
    destinationAmount: string;
    destinationCurrency: string;
    fees: {
      networkFee: string;
      transactionFee: string;
    };
    totalAmount: string;
  } | null;
}

export interface CreateOnrampSessionParams {
  walletAddress: string;
  network: "polygon" | "ethereum" | "base";
  amount?: number;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
}

/**
 * Create a Stripe Crypto Onramp session
 */
export async function createOnrampSession(
  params: CreateOnrampSessionParams
): Promise<OnrampSessionResponse> {
  const response = await fetch("/api/stripe/onramp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create onramp session");
  }

  return response.json();
}

/**
 * Get onramp quote for estimated conversion
 */
export async function getOnrampQuote(
  amount: number,
  network: string = "polygon"
): Promise<OnrampQuoteResponse> {
  const params = new URLSearchParams({
    amount: amount.toString(),
    network,
  });

  const response = await fetch(`/api/stripe/onramp?${params.toString()}`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get quote");
  }

  return response.json();
}

/**
 * Network display names
 */
export const NETWORK_NAMES: Record<string, string> = {
  polygon: "Polygon",
  ethereum: "Ethereum",
  base: "Base",
};

/**
 * Get estimated USDC amount after fees
 */
export function estimateUSDCAmount(sourceAmount: number): number {
  // Approximate fees: ~3% transaction fee + small network fee
  const estimatedFees = sourceAmount * 0.035;
  return Math.max(0, sourceAmount - estimatedFees);
}
