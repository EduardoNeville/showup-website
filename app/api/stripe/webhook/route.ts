import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      object: string;
      status: string;
      transaction_details?: {
        wallet_address?: string;
        destination_currency?: string;
        destination_amount?: string;
        destination_network?: string;
        source_amount?: string;
        source_currency?: string;
        transaction_id?: string;
      };
    };
  };
}

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for crypto onramp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!STRIPE_SECRET_KEY) {
      console.error("Stripe not configured");
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    // In production, verify webhook signature
    // For now, we'll parse the event directly
    let event: StripeEvent;

    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case "crypto.onramp_session_updated": {
        const session = event.data.object;
        console.log("Onramp session updated:", {
          sessionId: session.id,
          status: session.status,
          transactionDetails: session.transaction_details,
        });

        // Handle different statuses
        switch (session.status) {
          case "fulfillment_processing":
            // Payment successful, crypto is being delivered
            console.log("Onramp fulfillment processing:", session.id);
            // TODO: Update database with pending status
            break;

          case "fulfillment_complete":
            // Crypto delivered to wallet
            console.log("Onramp fulfillment complete:", {
              sessionId: session.id,
              walletAddress: session.transaction_details?.wallet_address,
              amount: session.transaction_details?.destination_amount,
              currency: session.transaction_details?.destination_currency,
              network: session.transaction_details?.destination_network,
              txHash: session.transaction_details?.transaction_id,
            });
            // TODO: Update database and notify user
            // TODO: Trigger challenge deposit flow if applicable
            break;

          case "rejected":
            // User was rejected (KYC failure, fraud, etc.)
            console.log("Onramp session rejected:", session.id);
            // TODO: Notify user and update database
            break;

          default:
            console.log("Unhandled onramp status:", session.status);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Verify Stripe webhook signature
 * Use this in production to ensure webhooks are from Stripe
 */
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const crypto = await import("crypto");

  const timestamp = signature.split(",")[0]?.split("=")[1];
  const sig = signature.split(",")[1]?.split("=")[1];

  if (!timestamp || !sig) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return sig === expectedSignature;
}
