"use client";

import React, { useState, useCallback, useEffect } from "react";
import { CreditCard } from "lucide-react";

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
async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<CheckoutSessionResponse> {
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
  onSuccess?: (sessionId: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Stripe Checkout component with Apple Pay/Card support and Test Mode
 *
 * In development/test environments, shows both real payment and test payment options.
 * In production, only shows real Stripe checkout.
 */
export function StripeCheckout({
  amount,
  challengeId,
  customerEmail,
  metadata,
  onSuccess,
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
      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={handleCheckout}
            className="mt-2 text-sm text-red-700 underline hover:no-underline dark:text-red-300"
          >
            Try again
          </button>
        </div>
      )}



      {/* Payment Button */}
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Processing...
          </span>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>Make your deposit</span>
          </>
        )}
      </button>

      {/* Payment Info */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Secure payment powered by Stripe. Your payment information is encrypted.
      </p>
    </div>
  );
}

export default StripeCheckout;
