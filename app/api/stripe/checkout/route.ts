import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface CreateCheckoutSessionRequest {
  amount: number; // Amount in USD (cents)
  challengeId?: string; // Optional challenge ID for tracking
  customerEmail?: string;
  metadata?: Record<string, string>;
}

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for fiat payments
 */
export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const body: CreateCheckoutSessionRequest = await request.json();
    const { amount, challengeId, customerEmail, metadata } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 },
      );
    }

    // Convert amount to cents (Stripe expects amounts in the smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "apple_pay"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Challenge Deposit",
              description: challengeId
                ? `Deposit for challenge ${challengeId}`
                : "Challenge deposit",
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${NEXT_PUBLIC_APP_URL}/deposit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${NEXT_PUBLIC_APP_URL}/deposit/cancelled`,
      customer_email: customerEmail,
      metadata: {
        challengeId: challengeId || "",
        ...metadata,
      },
      payment_intent_data: {
        metadata: {
          challengeId: challengeId || "",
          ...metadata,
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}

