import { NextRequest, NextResponse } from "next/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_API_URL = "https://api.stripe.com/v1/crypto/onramp_sessions";

interface OnrampSessionRequest {
  walletAddress: string;
  network: "polygon" | "ethereum" | "base";
  amount?: number; // Source amount in USD
  customerIp?: string;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
}

interface OnrampSessionResponse {
  id: string;
  client_secret: string;
  status: string;
  transaction_details: {
    destination_currency: string;
    destination_network: string;
    source_currency: string;
    source_amount: string | null;
    wallet_addresses: Record<string, string | null>;
  };
}

/**
 * POST /api/stripe/onramp
 * Creates a Stripe Crypto Onramp session for converting fiat to USDC
 */
export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body: OnrampSessionRequest = await request.json();
    const { walletAddress, network, amount, customerEmail, customerFirstName, customerLastName } =
      body;

    // Validate required fields
    if (!walletAddress || !network) {
      return NextResponse.json(
        { error: "walletAddress and network are required" },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid Ethereum wallet address" },
        { status: 400 }
      );
    }

    // Get customer IP from headers or request
    const customerIp =
      body.customerIp ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Map network to Stripe network name
    const networkMapping: Record<string, string> = {
      polygon: "polygon",
      ethereum: "ethereum",
      base: "base",
    };

    const destinationNetwork = networkMapping[network];
    if (!destinationNetwork) {
      return NextResponse.json(
        { error: "Unsupported network" },
        { status: 400 }
      );
    }

    // Build form data for Stripe API
    const formData = new URLSearchParams();

    // Wallet address based on network
    formData.append(`wallet_addresses[${destinationNetwork}]`, walletAddress);

    // Lock to USDC on specified network
    formData.append("destination_currency", "usdc");
    formData.append("destination_network", destinationNetwork);
    formData.append("destination_currencies[]", "usdc");
    formData.append("destination_networks[]", destinationNetwork);

    // Source currency (USD)
    formData.append("source_currency", "usd");

    // Optional: pre-fill amount
    if (amount && amount > 0) {
      formData.append("source_amount", amount.toString());
    }

    // Customer IP for geo-check
    formData.append("customer_ip_address", customerIp);

    // Lock wallet address so user can't change it
    formData.append("lock_wallet_address", "true");

    // Optional: pre-fill customer info
    if (customerEmail) {
      formData.append("customer_information[email]", customerEmail);
    }
    if (customerFirstName) {
      formData.append("customer_information[first_name]", customerFirstName);
    }
    if (customerLastName) {
      formData.append("customer_information[last_name]", customerLastName);
    }

    // Create onramp session with Stripe
    const response = await fetch(STRIPE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Stripe Onramp error:", data);

      // Handle specific error codes
      if (data.error?.code === "crypto_onramp_unsupportable_customer") {
        return NextResponse.json(
          {
            error: "Crypto onramp not available in your region",
            code: data.error.code,
          },
          { status: 400 }
        );
      }

      if (data.error?.code === "crypto_onramp_disabled") {
        return NextResponse.json(
          {
            error: "Crypto onramp is temporarily unavailable",
            code: data.error.code,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: data.error?.message || "Failed to create onramp session",
          code: data.error?.code,
        },
        { status: response.status }
      );
    }

    const session: OnrampSessionResponse = data;

    // Return client secret and session info
    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      status: session.status,
      transactionDetails: {
        destinationCurrency: session.transaction_details.destination_currency,
        destinationNetwork: session.transaction_details.destination_network,
        sourceCurrency: session.transaction_details.source_currency,
        sourceAmount: session.transaction_details.source_amount,
        walletAddress:
          session.transaction_details.wallet_addresses[destinationNetwork],
      },
    });
  } catch (error) {
    console.error("Onramp API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/onramp/quotes
 * Get conversion quotes for displaying estimated amounts
 */
export async function GET(request: NextRequest) {
  try {
    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const amount = searchParams.get("amount") || "100";
    const network = searchParams.get("network") || "polygon";

    // Build query params
    const params = new URLSearchParams({
      source_currency: "usd",
      source_amount: amount,
      "destination_currencies[]": "usdc",
      "destination_networks[]": network,
    });

    const response = await fetch(
      `https://api.stripe.com/v1/crypto/onramp/quotes?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Failed to get quotes" },
        { status: response.status }
      );
    }

    // Extract relevant quote info
    const quote = data.destination_network_quotes?.[network]?.[0];

    return NextResponse.json({
      sourceAmount: data.source_amount,
      sourceCurrency: data.source_currency,
      quote: quote
        ? {
            destinationAmount: quote.destination_amount,
            destinationCurrency: quote.destination_currency,
            fees: {
              networkFee: quote.fees?.network_fee_monetary,
              transactionFee: quote.fees?.transaction_fee_monetary,
            },
            totalAmount: quote.source_total_amount,
          }
        : null,
    });
  } catch (error) {
    console.error("Quote API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
