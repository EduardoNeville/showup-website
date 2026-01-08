"use client";

import { useState, useCallback, useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { useChallengeEscrow } from "@/lib/web3/hooks/useChallengeEscrow";
import { useWallet } from "@/lib/web3/hooks/useWallet";
import { StripeOnramp } from "./StripeOnramp";
import { ConnectWallet } from "./ConnectWallet";
import { cn } from "@/lib/utils";
import { ChallengeState, ChallengeStateLabels, formatUSDC, parseUSDC } from "@/types/contracts";
import { Wallet, DollarSign, Users, CreditCard, Rocket } from "lucide-react";

type DepositStep = "connect" | "amount" | "guarantors" | "funding" | "approve" | "deposit" | "complete";

interface ChallengeDepositProps {
  challengeTitle: string;
  challengeDescription: string;
  challengeDuration: number; // in days
  metadataUri: string;
  onComplete?: (challengeId: string) => void;
  className?: string;
}

/**
 * Complete challenge deposit flow component
 * Handles: Wallet connection -> Amount selection -> Guarantors -> Funding (fiat or existing USDC) -> Approve -> Deposit
 */
export function ChallengeDeposit({
  challengeTitle,
  challengeDescription,
  challengeDuration,
  metadataUri,
  onComplete,
  className,
}: ChallengeDepositProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { isOnSupportedChain } = useWallet();

  // Form state
  const [step, setStep] = useState<DepositStep>("connect");
  const [depositAmount, setDepositAmount] = useState<string>("100");
  const [guarantors, setGuarantors] = useState<string[]>([""]);
  const [fundingMethod, setFundingMethod] = useState<"existing" | "onramp">("existing");
  const [challengeId, setChallengeId] = useState<`0x${string}` | null>(null);

  // Escrow contract hook
  const escrow = useChallengeEscrow({ chainId });
  const { useUSDCBalance, useUSDCAllowance } = escrow;

  // Get USDC balance and allowance
  const { balance: usdcBalance, formatted: formattedBalance } = useUSDCBalance(address);
  const { allowance } = useUSDCAllowance(address);

  // Calculate amounts
  const depositAmountBigInt = useMemo(() => parseUSDC(depositAmount || "0"), [depositAmount]);
  const needsApproval = useMemo(
    () => allowance < depositAmountBigInt,
    [allowance, depositAmountBigInt]
  );
  const hasEnoughBalance = useMemo(
    () => usdcBalance >= depositAmountBigInt,
    [usdcBalance, depositAmountBigInt]
  );

  // Validate guarantors
  const validGuarantors = useMemo(() => {
    return guarantors
      .filter((g) => g.match(/^0x[a-fA-F0-9]{40}$/))
      .map((g) => g as `0x${string}`);
  }, [guarantors]);

  // Update step based on connection state
  useMemo(() => {
    if (!isConnected) {
      setStep("connect");
    } else if (step === "connect") {
      setStep("amount");
    }
  }, [isConnected, step]);

  // Handle guarantor input changes
  const updateGuarantor = useCallback((index: number, value: string) => {
    setGuarantors((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  const addGuarantor = useCallback(() => {
    if (guarantors.length < 10) {
      setGuarantors((prev) => [...prev, ""]);
    }
  }, [guarantors.length]);

  const removeGuarantor = useCallback((index: number) => {
    if (guarantors.length > 1) {
      setGuarantors((prev) => prev.filter((_, i) => i !== index));
    }
  }, [guarantors.length]);

  // Handle approval
  const handleApprove = useCallback(async () => {
    try {
      // Approve max amount for better UX
      const maxApproval = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      escrow.approveUSDC(maxApproval);
    } catch (error) {
      console.error("Approval error:", error);
    }
  }, [escrow]);

  // Handle deposit
  const handleDeposit = useCallback(async () => {
    if (!address || validGuarantors.length === 0) return;

    try {
      // Generate challenge ID
      const newChallengeId = escrow.generateChallengeId(
        address,
        Date.now(),
        Math.random().toString(36).substring(7)
      );
      setChallengeId(newChallengeId);

      // Duration in seconds
      const durationSeconds = BigInt(challengeDuration * 24 * 60 * 60);

      escrow.createChallenge({
        challengeId: newChallengeId,
        guarantors: validGuarantors,
        amount: depositAmountBigInt,
        duration: durationSeconds,
        metadataUri,
      });
    } catch (error) {
      console.error("Deposit error:", error);
    }
  }, [
    address,
    validGuarantors,
    depositAmountBigInt,
    challengeDuration,
    metadataUri,
    escrow,
  ]);

  // Watch for transaction completion
  useMemo(() => {
    if (escrow.isConfirmed && step === "deposit" && challengeId) {
      setStep("complete");
      onComplete?.(challengeId);
    }
  }, [escrow.isConfirmed, step, challengeId, onComplete]);

  // Handle onramp success
  const handleOnrampSuccess = useCallback(() => {
    // After successful onramp, check if we need approval or can deposit directly
    if (needsApproval) {
      setStep("approve");
    } else {
      setStep("deposit");
    }
  }, [needsApproval]);

  return (
    <div className={cn("rounded-2xl neumorphic p-6", className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-foreground">{challengeTitle}</h2>
        <p className="mt-1 text-muted-foreground">{challengeDescription}</p>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span>{challengeDuration} day challenge</span>
          <span>|</span>
          <span>Your USDC: {formattedBalance}</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {([
            { key: "connect", icon: Wallet, label: "Connect" },
            { key: "amount", icon: DollarSign, label: "Amount" },
            { key: "guarantors", icon: Users, label: "Friends" },
            { key: "funding", icon: CreditCard, label: "Fund" },
            { key: "deposit", icon: Rocket, label: "Deposit" },
          ] as const).map(({ key, icon: Icon, label }, i) => (
            <div key={key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                    step === key || getStepIndex(step) > i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs text-muted-foreground hidden sm:block">{label}</span>
              </div>
              {i < 4 && (
                <div
                  className={cn(
                    "h-1 w-8 sm:w-12 md:w-16 transition-all duration-300 mt-[-1rem] sm:mt-[-1.5rem]",
                    getStepIndex(step) > i ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {/* Step 1: Connect Wallet */}
        {step === "connect" && (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in-up">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
              <WalletIcon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-serif font-semibold">Connect Your Wallet</h3>
            <p className="mb-6 text-center text-muted-foreground">
              Connect your wallet to deposit USDC and start your challenge.
            </p>
            <ConnectWallet />
          </div>
        )}

        {/* Step 2: Select Amount */}
        {step === "amount" && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Deposit Amount (USDC)
              </label>
              <div className="mt-2 flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-3 pl-8 pr-4 text-lg font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-300"
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {[25, 50, 100, 250, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(amount.toString())}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                      depositAmount === amount.toString()
                        ? "bg-primary text-primary-foreground"
                        : "neumorphic-inset hover:bg-muted"
                    )}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            <p className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">
              This amount will be held in a smart contract until you complete your
              challenge or your guarantors vote on your Path of Redemption.
            </p>

            <button
              onClick={() => setStep("guarantors")}
              disabled={!depositAmount || parseFloat(depositAmount) < 1}
              className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Add Guarantors */}
        {step === "guarantors" && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Guarantor Wallet Addresses
              </label>
              <p className="mt-1 text-sm text-muted-foreground">
                These friends will verify your challenge and can vote on your Path of
                Redemption if you fail.
              </p>

              <div className="mt-4 space-y-3">
                {guarantors.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={g}
                      onChange={(e) => updateGuarantor(i, e.target.value)}
                      placeholder="0x..."
                      className={cn(
                        "flex-1 rounded-xl border bg-background py-2 px-3 font-mono text-sm focus:outline-none focus:ring-2 transition-all duration-300",
                        g && !g.match(/^0x[a-fA-F0-9]{40}$/)
                          ? "border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-primary focus:ring-ring/20"
                      )}
                    />
                    {guarantors.length > 1 && (
                      <button
                        onClick={() => removeGuarantor(i)}
                        className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300"
                      >
                        <CloseIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {guarantors.length < 10 && (
                <button
                  onClick={addGuarantor}
                  className="mt-3 text-sm font-medium text-primary hover:underline transition-all duration-300"
                >
                  + Add another guarantor
                </button>
              )}
            </div>

            <div className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">
              <strong>Tip:</strong> Choose an odd number of guarantors (1, 3, 5) to
              avoid tie votes. A majority is required to approve your Path of
              Redemption.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("amount")}
                className="flex-1 rounded-xl border border-border py-3 font-medium text-foreground neumorphic-inset hover:bg-muted transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep("funding")}
                disabled={validGuarantors.length === 0}
                className="flex-1 rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue ({validGuarantors.length} guarantor
                {validGuarantors.length !== 1 ? "s" : ""})
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Funding Method */}
        {step === "funding" && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h3 className="text-lg font-serif font-semibold">How would you like to fund?</h3>
              <p className="mt-1 text-muted-foreground">
                Deposit ${depositAmount} USDC to start your challenge.
              </p>
            </div>

            <div className="space-y-3">
              {/* Existing USDC option */}
              <button
                onClick={() => setFundingMethod("existing")}
                disabled={!hasEnoughBalance}
                className={cn(
                  "flex w-full items-center rounded-xl p-4 transition-all duration-300",
                  fundingMethod === "existing" && hasEnoughBalance
                    ? "bg-accent border-2 border-primary"
                    : "neumorphic hover:bg-muted",
                  !hasEnoughBalance && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                  <CoinIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4 flex-1 text-left">
                  <p className="font-medium text-foreground">Use Existing USDC</p>
                  <p className="text-sm text-muted-foreground">
                    Balance: {formattedBalance}
                    {!hasEnoughBalance && (
                      <span className="ml-2 text-destructive">(Insufficient)</span>
                    )}
                  </p>
                </div>
                {fundingMethod === "existing" && hasEnoughBalance && (
                  <CheckIcon className="h-6 w-6 text-primary" />
                )}
              </button>

              {/* Buy with card option */}
              <button
                onClick={() => setFundingMethod("onramp")}
                className={cn(
                  "flex w-full items-center rounded-xl p-4 transition-all duration-300",
                  fundingMethod === "onramp"
                    ? "bg-accent border-2 border-primary"
                    : "neumorphic hover:bg-muted"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                  <CardIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4 flex-1 text-left">
                  <p className="font-medium text-foreground">Buy with Card</p>
                  <p className="text-sm text-muted-foreground">
                    Purchase USDC instantly via Stripe
                  </p>
                </div>
                {fundingMethod === "onramp" && (
                  <CheckIcon className="h-6 w-6 text-primary" />
                )}
              </button>
            </div>

            {/* Stripe Onramp */}
            {fundingMethod === "onramp" && address && (
              <div className="mt-6 rounded-xl neumorphic p-4">
                <StripeOnramp
                  walletAddress={address}
                  network="polygon"
                  amount={parseFloat(depositAmount)}
                  onSuccess={handleOnrampSuccess}
                  onError={(error) => console.error("Onramp error:", error)}
                />
              </div>
            )}

            {fundingMethod === "existing" && hasEnoughBalance && (
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("guarantors")}
                  className="flex-1 rounded-xl border border-border py-3 font-medium text-foreground neumorphic-inset hover:bg-muted transition-all duration-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(needsApproval ? "approve" : "deposit")}
                  className="flex-1 rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02]"
                >
                  Continue to {needsApproval ? "Approve" : "Deposit"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Approve */}
        {step === "approve" && (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in-up">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
              <LockIcon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-serif font-semibold">Approve USDC Spending</h3>
            <p className="mb-6 text-center text-muted-foreground">
              Allow the escrow contract to hold your USDC during the challenge.
            </p>

            {escrow.writeError && (
              <p className="mb-4 text-sm text-destructive">
                Error: {escrow.writeError.message}
              </p>
            )}

            <button
              onClick={handleApprove}
              disabled={escrow.isWritePending || escrow.isConfirming}
              className="w-full max-w-xs rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {escrow.isWritePending || escrow.isConfirming ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {escrow.isConfirming ? "Confirming..." : "Approving..."}
                </span>
              ) : (
                "Approve USDC"
              )}
            </button>

            {escrow.isConfirmed && (
              <button
                onClick={() => setStep("deposit")}
                className="mt-4 text-primary underline hover:no-underline transition-all duration-300"
              >
                Continue to deposit
              </button>
            )}
          </div>
        )}

        {/* Step 6: Deposit */}
        {step === "deposit" && (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in-up">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
              <RocketIcon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-serif font-semibold">Confirm Your Challenge</h3>
            <p className="mb-6 text-center text-muted-foreground">
              Deposit ${depositAmount} USDC to start your {challengeDuration}-day
              challenge.
            </p>

            <div className="mb-6 w-full max-w-sm rounded-xl bg-muted p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">${depositAmount} USDC</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{challengeDuration} days</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Guarantors</span>
                <span className="font-medium">{validGuarantors.length}</span>
              </div>
            </div>

            {escrow.writeError && (
              <p className="mb-4 text-sm text-destructive">
                Error: {escrow.writeError.message}
              </p>
            )}

            <button
              onClick={handleDeposit}
              disabled={escrow.isWritePending || escrow.isConfirming}
              className="w-full max-w-xs rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {escrow.isWritePending || escrow.isConfirming ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {escrow.isConfirming ? "Confirming..." : "Depositing..."}
                </span>
              ) : (
                "Start Challenge"
              )}
            </button>
          </div>
        )}

        {/* Step 7: Complete */}
        {step === "complete" && (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in-up">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
              <CheckIcon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-serif font-semibold">Challenge Started!</h3>
            <p className="mb-2 text-center text-muted-foreground">
              Your ${depositAmount} USDC is now held in escrow.
            </p>
            <p className="mb-6 text-center text-muted-foreground">
              Complete your challenge to get it back!
            </p>

            {challengeId && (
              <p className="font-mono text-xs text-muted-foreground">
                Challenge ID: {challengeId.slice(0, 16)}...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function
function getStepIndex(step: DepositStep): number {
  const steps: DepositStep[] = ["connect", "amount", "guarantors", "funding", "approve", "deposit", "complete"];
  return steps.indexOf(step);
}

// Icons
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export default ChallengeDeposit;
