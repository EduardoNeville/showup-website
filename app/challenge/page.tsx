"use client";

import { useState } from "react";
import { ChallengeDeposit, ConnectWallet } from "@/components/web3";

export default function ChallengePage() {
  const [challengeId, setChallengeId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Showup</span>
          </div>
          <ConnectWallet showBalance showChain />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-6 py-12">
        {challengeId ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-green-900">
              Challenge Created!
            </h1>
            <p className="mb-4 text-green-700">
              Your challenge is now active. Good luck!
            </p>
            <p className="font-mono text-sm text-green-600">
              ID: {challengeId.slice(0, 20)}...
            </p>
            <button
              onClick={() => setChallengeId(null)}
              className="mt-6 rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700"
            >
              Create Another Challenge
            </button>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-gray-900">
                Start Your Challenge
              </h1>
              <p className="mt-3 text-lg text-gray-600">
                Put your money where your motivation is. Your friends will hold
                you accountable.
              </p>
            </div>

            {/* Challenge Deposit Component */}
            <ChallengeDeposit
              challengeTitle="30-Day Fitness Challenge"
              challengeDescription="Exercise for at least 30 minutes every day for 30 days."
              challengeDuration={30}
              metadataUri="ipfs://example-metadata-uri"
              onComplete={(id) => setChallengeId(id)}
            />

            {/* Info Cards */}
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Secure Escrow</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Funds held in a smart contract, not by us.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <svg
                    className="h-5 w-5 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Friend Guarantors</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Your friends verify success and can grant second chances.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Easy Funding</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Use existing crypto or buy with a card via Stripe.
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          <p>Built on Polygon with Stripe Crypto Onramp</p>
        </div>
      </footer>
    </div>
  );
}
