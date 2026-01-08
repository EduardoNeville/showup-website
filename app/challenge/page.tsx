"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChallengeDeposit, ConnectWallet } from "@/components/web3";
import Letter3DSwap from "@/components/fancy/text/letter-3d-swap";
import { FeatureCard } from "@/components/FeatureCard";

export default function ChallengePage() {
  const [challengeId, setChallengeId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/showup-icon.svg"
              alt="Showup Icon"
              width={32}
              height={32}
              className="drop-shadow-lg"
            />
            <span className="text-xl font-serif font-bold">Showup</span>
          </Link>
          <ConnectWallet showBalance showChain />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-12 md:py-16">
        {challengeId ? (
          <div className="neumorphic rounded-2xl p-8 text-center animate-fade-in-up">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent">
              <svg
                className="h-10 w-10 text-primary"
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
            <Letter3DSwap
              as="h1"
              mainClassName="text-3xl md:text-4xl font-serif font-bold mb-4"
              staggerDuration={0.02}
            >
              Challenge Created!
            </Letter3DSwap>
            <p className="mb-4 text-lg text-muted-foreground">
              Your challenge is now active. Good luck!
            </p>
            <p className="font-mono text-sm text-muted-foreground">
              ID: {challengeId.slice(0, 20)}...
            </p>
            <button
              onClick={() => setChallengeId(null)}
              className="mt-8 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium neumorphic hover:scale-105 transition-all duration-300"
            >
              Create Another Challenge
            </button>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="mb-10 text-center animate-fade-in-up">
              <div className="flex justify-center mb-6">
                <Image
                  src="/showup-icon.svg"
                  alt="Showup Icon"
                  width={80}
                  height={80}
                  className="drop-shadow-lg"
                />
              </div>
              <Letter3DSwap
                as="h1"
                mainClassName="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4"
                staggerDuration={0.02}
              >
                Start Your Challenge
              </Letter3DSwap>
              <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
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
            <section className="mt-16 py-12 px-4 bg-muted -mx-4 rounded-2xl">
              <Letter3DSwap
                as="h2"
                mainClassName="text-2xl md:text-3xl font-serif font-bold text-center mb-10"
                staggerDuration={0.02}
              >
                Why Showup Works
              </Letter3DSwap>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-right">
                <FeatureCard
                  title="Secure Escrow"
                  description="Funds held in a smart contract, not by us."
                />
                <FeatureCard
                  title="Friend Guarantors"
                  description="Your friends verify success and can grant second chances."
                />
                <FeatureCard
                  title="Easy Funding"
                  description="Use existing crypto or buy with a card via Stripe."
                />
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 bg-muted text-center">
        <p className="text-muted-foreground">
          Built on Polygon with Stripe Crypto Onramp |{" "}
          <Link href="/" className="underline">
            Home
          </Link>{" "}
          |{" "}
          <a href="#" className="underline">
            Privacy
          </a>{" "}
          |{" "}
          <a href="#" className="underline">
            Terms
          </a>
        </p>
      </footer>
    </div>
  );
}
