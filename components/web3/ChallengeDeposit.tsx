"use client";

import { useState, useCallback, useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { useChallengeEscrow } from "@/lib/web3/hooks/useChallengeEscrow";
import { useWallet } from "@/lib/web3/hooks/useWallet";
import { StripeOnramp } from "./StripeOnramp";
import { ConnectWallet } from "./ConnectWallet";
import { cn } from "@/lib/utils";
import { ChallengeState, ChallengeStateLabels, formatUSDC, parseUSDC } from "@/types/contracts";

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
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-6 shadow-lg", className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{challengeTitle}</h2>
        <p className="mt-1 text-gray-600">{challengeDescription}</p>
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
          <span>{challengeDuration} day challenge</span>
          <span>|</span>
          <span>Your USDC: {formattedBalance}</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {(["connect", "amount", "guarantors", "funding", "deposit"] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  step === s || getStepIndex(step) > i
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {i + 1}
              </div>
              {i < 4 && (
                <div
                  className={cn(
                    "h-1 w-12 sm:w-16",
                    getStepIndex(step) > i ? "bg-blue-600" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Connect</span>
          <span>Amount</span>
          <span>Friends</span>
          <span>Fund</span>
          <span>Deposit</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {/* Step 1: Connect Wallet */}
        {step === "connect" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <WalletIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Connect Your Wallet</h3>
            <p className="mb-6 text-center text-gray-600">
              Connect your wallet to deposit USDC and start your challenge.
            </p>
            <ConnectWallet />
          </div>
        )}

        {/* Step 2: Select Amount */}
        {step === "amount" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Deposit Amount (USDC)
              </label>
              <div className="mt-2 flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-3 pl-8 pr-4 text-lg font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {[25, 50, 100, 250, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(amount.toString())}
                    className={cn(
                      "rounded-lg px-3 py-1 text-sm font-medium transition-all",
                      depositAmount === amount.toString()
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              This amount will be held in a smart contract until you complete your
              challenge or your guarantors vote on your Path of Redemption.
            </p>

            <button
              onClick={() => setStep("guarantors")}
              disabled={!depositAmount || parseFloat(depositAmount) < 1}
              className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Add Guarantors */}
        {step === "guarantors" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Guarantor Wallet Addresses
              </label>
              <p className="mt-1 text-sm text-gray-500">
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
                        "flex-1 rounded-lg border py-2 px-3 font-mono text-sm focus:outline-none focus:ring-2",
                        g && !g.match(/^0x[a-fA-F0-9]{40}$/)
                          ? "border-red-300 focus:ring-red-500/20"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                      )}
                    />
                    {guarantors.length > 1 && (
                      <button
                        onClick={() => removeGuarantor(i)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  + Add another guarantor
                </button>
              )}
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <strong>Tip:</strong> Choose an odd number of guarantors (1, 3, 5) to
              avoid tie votes. A majority is required to approve your Path of
              Redemption.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("amount")}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep("funding")}
                disabled={validGuarantors.length === 0}
                className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Continue ({validGuarantors.length} guarantor
                {validGuarantors.length !== 1 ? "s" : ""})
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Funding Method */}
        {step === "funding" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">How would you like to fund?</h3>
              <p className="mt-1 text-gray-600">
                Deposit ${depositAmount} USDC to start your challenge.
              </p>
            </div>

            <div className="space-y-3">
              {/* Existing USDC option */}
              <button
                onClick={() => setFundingMethod("existing")}
                disabled={!hasEnoughBalance}
                className={cn(
                  "flex w-full items-center rounded-xl border p-4 transition-all",
                  fundingMethod === "existing" && hasEnoughBalance
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300",
                  !hasEnoughBalance && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <CoinIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4 flex-1 text-left">
                  <p className="font-medium text-gray-900">Use Existing USDC</p>
                  <p className="text-sm text-gray-500">
                    Balance: {formattedBalance}
                    {!hasEnoughBalance && (
                      <span className="ml-2 text-red-500">(Insufficient)</span>
                    )}
                  </p>
                </div>
                {fundingMethod === "existing" && hasEnoughBalance && (
                  <CheckIcon className="h-6 w-6 text-blue-600" />
                )}
              </button>

              {/* Buy with card option */}
              <button
                onClick={() => setFundingMethod("onramp")}
                className={cn(
                  "flex w-full items-center rounded-xl border p-4 transition-all",
                  fundingMethod === "onramp"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <CardIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4 flex-1 text-left">
                  <p className="font-medium text-gray-900">Buy with Card</p>
                  <p className="text-sm text-gray-500">
                    Purchase USDC instantly via Stripe
                  </p>
                </div>
                {fundingMethod === "onramp" && (
                  <CheckIcon className="h-6 w-6 text-blue-600" />
                )}
              </button>
            </div>

            {/* Stripe Onramp */}
            {fundingMethod === "onramp" && address && (
              <div className="mt-6 rounded-xl border border-gray-200 p-4">
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
                  className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(needsApproval ? "approve" : "deposit")}
                  className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-all hover:bg-blue-700"
                >
                  Continue to {needsApproval ? "Approve" : "Deposit"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Approve */}
        {step === "approve" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <LockIcon className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Approve USDC Spending</h3>
            <p className="mb-6 text-center text-gray-600">
              Allow the escrow contract to hold your USDC during the challenge.
            </p>

            {escrow.writeError && (
              <p className="mb-4 text-sm text-red-600">
                Error: {escrow.writeError.message}
              </p>
            )}

            <button
              onClick={handleApprove}
              disabled={escrow.isWritePending || escrow.isConfirming}
              className="w-full max-w-xs rounded-lg bg-amber-500 py-3 font-medium text-white transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {escrow.isWritePending || escrow.isConfirming ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {escrow.isConfirming ? "Confirming..." : "Approving..."}
                </span>
              ) : (
                "Approve USDC"
              )}
            </button>

            {escrow.isConfirmed && (
              <button
                onClick={() => setStep("deposit")}
                className="mt-4 text-blue-600 underline hover:no-underline"
              >
                Continue to deposit
              </button>
            )}
          </div>
        )}

        {/* Step 6: Deposit */}
        {step === "deposit" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <RocketIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Confirm Your Challenge</h3>
            <p className="mb-6 text-center text-gray-600">
              Deposit ${depositAmount} USDC to start your {challengeDuration}-day
              challenge.
            </p>

            <div className="mb-6 w-full max-w-sm rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">${depositAmount} USDC</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium">{challengeDuration} days</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Guarantors</span>
                <span className="font-medium">{validGuarantors.length}</span>
              </div>
            </div>

            {escrow.writeError && (
              <p className="mb-4 text-sm text-red-600">
                Error: {escrow.writeError.message}
              </p>
            )}

            <button
              onClick={handleDeposit}
              disabled={escrow.isWritePending || escrow.isConfirming}
              className="w-full max-w-xs rounded-lg bg-blue-600 py-3 font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {escrow.isWritePending || escrow.isConfirming ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckIcon className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Challenge Started!</h3>
            <p className="mb-2 text-center text-gray-600">
              Your ${depositAmount} USDC is now held in escrow.
            </p>
            <p className="mb-6 text-center text-gray-600">
              Complete your challenge to get it back!
            </p>

            {challengeId && (
              <p className="font-mono text-xs text-gray-400">
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
