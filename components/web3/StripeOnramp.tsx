"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createOnrampSession, type CreateOnrampSessionParams } from "@/lib/stripe/onramp";

// Stripe Onramp types
interface OnrampSession {
  status: string;
  id: string;
}

interface OnrampSessionEvent {
  type: string;
  payload: {
    session: OnrampSession;
  };
}

interface StripeOnrampInstance {
  createSession: (options: {
    clientSecret: string;
    appearance?: { theme: "light" | "dark" };
  }) => {
    mount: (element: string | HTMLElement) => void;
    addEventListener: (event: string, callback: (e: OnrampSessionEvent) => void) => void;
    removeEventListener: (event: string, callback: (e: OnrampSessionEvent) => void) => void;
  };
}

declare global {
  interface Window {
    StripeOnramp?: (publishableKey: string) => StripeOnrampInstance;
  }
}

export interface StripeOnrampProps {
  walletAddress: string;
  network: "polygon" | "ethereum" | "base";
  amount?: number;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  theme?: "light" | "dark";
  onSuccess?: (sessionId: string) => void;
  onError?: (error: Error) => void;
  onSessionUpdate?: (status: string) => void;
  className?: string;
}

/**
 * Stripe Crypto Onramp component
 * Embeds Stripe's fiat-to-crypto onramp widget
 */
export function StripeOnramp({
  walletAddress,
  network,
  amount,
  customerEmail,
  customerFirstName,
  customerLastName,
  theme = "light",
  onSuccess,
  onError,
  onSessionUpdate,
  className,
}: StripeOnrampProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const initializeOnramp = useCallback(async () => {
    if (!containerRef.current || !publishableKey) {
      setError("Stripe not configured");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create onramp session via our API
      const params: CreateOnrampSessionParams = {
        walletAddress,
        network,
        amount,
        customerEmail,
        customerFirstName,
        customerLastName,
      };

      const { clientSecret, sessionId: newSessionId } = await createOnrampSession(params);
      setSessionId(newSessionId);

      // Wait for Stripe script to load
      if (!window.StripeOnramp) {
        await loadStripeOnrampScript();
      }

      if (!window.StripeOnramp) {
        throw new Error("Failed to load Stripe Onramp");
      }

      // Initialize Stripe Onramp
      const stripeOnramp = window.StripeOnramp(publishableKey);
      const session = stripeOnramp.createSession({
        clientSecret,
        appearance: { theme },
      });

      // Handle session updates
      session.addEventListener("onramp_session_updated", (event: OnrampSessionEvent) => {
        const status = event.payload.session.status;
        onSessionUpdate?.(status);

        if (status === "fulfillment_complete") {
          onSuccess?.(event.payload.session.id);
        } else if (status === "rejected") {
          onError?.(new Error("Onramp session was rejected"));
        }
      });

      // Mount the onramp UI
      containerRef.current.innerHTML = "";
      session.mount(containerRef.current);
      setIsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error.message);
      setIsLoading(false);
      onError?.(error);
    }
  }, [
    walletAddress,
    network,
    amount,
    customerEmail,
    customerFirstName,
    customerLastName,
    theme,
    publishableKey,
    onSuccess,
    onError,
    onSessionUpdate,
  ]);

  useEffect(() => {
    initializeOnramp();
  }, [initializeOnramp]);

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={initializeOnramp}
          className="mt-2 text-sm text-red-700 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <span className="ml-3 text-gray-600">Loading payment options...</span>
        </div>
      )}
      <div
        ref={containerRef}
        className={isLoading ? "hidden" : "min-h-[400px]"}
      />
      {sessionId && (
        <p className="mt-2 text-xs text-gray-500">
          Session: {sessionId.slice(0, 20)}...
        </p>
      )}
    </div>
  );
}

/**
 * Load Stripe Onramp script dynamically
 */
function loadStripeOnrampScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.StripeOnramp) {
      resolve();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector(
      'script[src="https://crypto-js.stripe.com/crypto-onramp-outer.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      return;
    }

    // Load Stripe.js first
    const stripeScript = document.createElement("script");
    stripeScript.src = "https://js.stripe.com/v3/";
    stripeScript.async = true;

    stripeScript.onload = () => {
      // Then load Onramp script
      const onrampScript = document.createElement("script");
      onrampScript.src = "https://crypto-js.stripe.com/crypto-onramp-outer.js";
      onrampScript.async = true;
      onrampScript.onload = () => resolve();
      onrampScript.onerror = () => reject(new Error("Failed to load Stripe Onramp script"));
      document.head.appendChild(onrampScript);
    };

    stripeScript.onerror = () => reject(new Error("Failed to load Stripe script"));
    document.head.appendChild(stripeScript);
  });
}

export default StripeOnramp;
