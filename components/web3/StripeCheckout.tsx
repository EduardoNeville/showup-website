"use client";

import React, { useState, useCallback } from "react";

interface CreateCheckoutSessionParams {
  amount: number; // Amount in USD
  challengeId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Create a Stripe Checkout session
 */
async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create checkout session");
  }

  return response.json();
}

export interface StripeCheckoutProps {
  amount: number; // Amount in USD
  challengeId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Stripe Checkout component for fiat payments with Apple Pay/Card support
 */
export function StripeCheckout({
  amount,
  challengeId,
  customerEmail,
  metadata,
  onError,
  className,
  children,
}: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { url } = await createCheckoutSession({
        amount,
        challengeId,
        customerEmail,
        metadata,
      });

      // Redirect to Stripe Checkout
      window.location.href = url;

      // Note: onSuccess will be called via success page redirect
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error.message);
      setIsLoading(false);
      onError?.(error);
    }
  }, [amount, challengeId, customerEmail, metadata, onError]);

  if (children) {
    return (
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? "Processing..." : children}
      </button>
    );
  }

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={handleCheckout}
            className="mt-2 text-sm text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Processing...
          </span>
        ) : (
          `Pay $${amount} with Apple Pay / Card`
        )}
      </button>
    </div>
  );
}

export default StripeCheckout;