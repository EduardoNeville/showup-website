import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import {
  createChallengeOnChain,
  checkEscrowContract,
  type CreateChallengeParams,
} from "@/lib/web3/server/escrowService";
import { insertChallenge, updateChallengeOnChain, markChallengeFailed } from "@/lib/db/challenges";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for payment completion
 * 
 * Flow:
 * 1. User pays with credit card / Apple Pay via Stripe Checkout
 * 2. Stripe sends webhook on payment completion
 * 3. We create the smart contract challenge on-chain
 * 4. User is redirected to success page with challenge details
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

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    // Verify webhook signature in production
    let event: Stripe.Event;

    if (STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      // Development mode - parse event directly (not recommended for production)
      try {
        event = JSON.parse(body) as Stripe.Event;
        console.warn("Webhook signature not verified - development mode only");
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log("Checkout session completed:", {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          amount: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email,
          metadata: session.metadata,
        });

        if (session.payment_status === "paid") {
          // Payment successful - create smart contract challenge
          await handleSuccessfulPayment(session);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment intent succeeded:", {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          metadata: paymentIntent.metadata,
        });
        // Additional handling if needed
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
 * Handle successful payment and create on-chain challenge
 */
async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  
  // Check if this is a challenge deposit
  if (metadata.type !== "challenge_deposit") {
    console.log("Not a challenge deposit, skipping smart contract creation");
    return;
  }

  const challengeId = metadata.challengeId;
  const challengeTitle = metadata.challengeTitle || "Challenge";
  const challengeDuration = parseInt(metadata.challengeDuration || "30", 10);
  const metadataUri = metadata.metadataUri || "";
  const guarantorsJson = metadata.guarantors || "[]";
  
  let guarantors: string[] = [];
  try {
    guarantors = JSON.parse(guarantorsJson);
  } catch {
    console.error("Failed to parse guarantors:", guarantorsJson);
  }

  // Amount in dollars (session.amount_total is in cents)
  const amountUSD = (session.amount_total || 0) / 100;

  console.log("Processing challenge deposit:", {
    challengeId,
    challengeTitle,
    amount: amountUSD,
    duration: challengeDuration,
    guarantors,
    customerEmail: session.customer_details?.email,
  });

  // Check if escrow contract is deployed
  const isContractDeployed = await checkEscrowContract();
  
  if (!isContractDeployed) {
    console.warn("Escrow contract not deployed. Storing challenge for later processing.");

    // Store challenge in database for processing when contract is deployed
    try {
      await insertChallenge({
        challengeId: challengeId || `challenge_${Date.now()}`,
        title: challengeTitle,
        durationDays: challengeDuration,
        amountUsd: amountUSD,
        userEmail: session.customer_details?.email || "",
        guarantors,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        metadataUri,
      });

      console.log("Challenge stored in database for later processing:", {
        challengeId,
        stripeSessionId: session.id,
        amount: amountUSD,
        customerEmail: session.customer_details?.email,
      });
    } catch (error) {
      console.error("Failed to store challenge in database:", error);
      // Continue anyway - don't block the webhook
    }

    return;
  }

  // Create challenge on-chain
  const params: CreateChallengeParams = {
    challengeId: challengeId || `challenge_${Date.now()}`,
    userEmail: session.customer_details?.email || "",
    amount: amountUSD,
    durationDays: challengeDuration,
    guarantorEmails: guarantors,
    metadataUri,
    challengeTitle,
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
  };

  const result = await createChallengeOnChain(params);

  if (result.success) {
    console.log("Challenge created successfully:", {
      challengeId: result.challengeId,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber?.toString(),
    });

    // Store challenge mapping in database
    try {
      const startedAt = new Date();
      const endsAt = new Date(startedAt);
      endsAt.setDate(endsAt.getDate() + challengeDuration);

      await insertChallenge({
        challengeId: challengeId || `challenge_${Date.now()}`,
        title: challengeTitle,
        durationDays: challengeDuration,
        amountUsd: amountUSD,
        userEmail: session.customer_details?.email || "",
        guarantors,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        metadataUri,
      });

      await updateChallengeOnChain(challengeId || `challenge_${Date.now()}`, {
        status: 'created',
        onChainChallengeId: result.challengeId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        startedAt,
        endsAt,
      });

      console.log("Challenge stored successfully in database with on-chain data");
    } catch (error) {
      console.error("Failed to store challenge mapping in database:", error);
      // Continue anyway - challenge was created on-chain successfully
    }

    // TODO: Send confirmation email to user
    // TODO: Send invitation emails to guarantors
  } else {
    console.error("Failed to create challenge on-chain:", result.error);

    // Store failed challenge for retry
    try {
      await insertChallenge({
        challengeId: challengeId || `challenge_${Date.now()}`,
        title: challengeTitle,
        durationDays: challengeDuration,
        amountUsd: amountUSD,
        userEmail: session.customer_details?.email || "",
        guarantors,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        metadataUri,
      });

      await markChallengeFailed(challengeId || `challenge_${Date.now()}`, result.error || 'Unknown error');

      console.log("Failed challenge stored in database for retry");
    } catch (dbError) {
      console.error("Failed to store failed challenge in database:", dbError);
    }

    // TODO: Implement retry logic or manual review queue
    // TODO: Alert admin for manual intervention
    // TODO: Potentially refund user if repeated failures
  }
}
