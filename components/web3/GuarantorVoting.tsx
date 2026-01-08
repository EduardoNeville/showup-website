"use client";

import { useState, useMemo, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { useChallengeEscrow } from "@/lib/web3/hooks/useChallengeEscrow";
import { ConnectWallet } from "./ConnectWallet";
import { cn } from "@/lib/utils";
import {
  ChallengeState,
  ChallengeStateLabels,
  formatUSDC,
} from "@/types/contracts";

interface GuarantorVotingProps {
  challengeId: `0x${string}`;
  challengeTitle?: string;
  challengeDescription?: string;
  onVoteComplete?: (approved: boolean) => void;
  className?: string;
}

/**
 * Guarantor voting component for Path of Redemption
 */
export function GuarantorVoting({
  challengeId,
  challengeTitle = "Challenge",
  challengeDescription,
  onVoteComplete,
  className,
}: GuarantorVotingProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const escrow = useChallengeEscrow({ chainId });

  // Get challenge and voting data
  const { challenge, isLoading: isChallengeLoading } = escrow.useChallenge(challengeId);
  const { votingState, isLoading: isVotingLoading } = escrow.useVotingState(challengeId);
  const { hasVoted, isLoading: isHasVotedLoading } = escrow.useHasVoted(challengeId, address);

  const [selectedVote, setSelectedVote] = useState<boolean | null>(null);

  // Check if current user is a guarantor
  const isGuarantor = useMemo(() => {
    if (!address || !votingState) return false;
    return votingState.guarantors.some(
      (g) => g.toLowerCase() === address.toLowerCase()
    );
  }, [address, votingState]);

  // Calculate voting progress
  const votingProgress = useMemo(() => {
    if (!votingState) return null;
    const totalVotes = Number(votingState.yesVotes) + Number(votingState.noVotes);
    const totalGuarantors = votingState.guarantors.length;
    const yesPercentage =
      totalGuarantors > 0
        ? (Number(votingState.yesVotes) / totalGuarantors) * 100
        : 0;
    const noPercentage =
      totalGuarantors > 0
        ? (Number(votingState.noVotes) / totalGuarantors) * 100
        : 0;

    return {
      yesVotes: Number(votingState.yesVotes),
      noVotes: Number(votingState.noVotes),
      totalVotes,
      totalGuarantors,
      requiredVotes: Number(votingState.requiredVotes),
      yesPercentage,
      noPercentage,
    };
  }, [votingState]);

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (!challenge?.votingDeadline) return null;
    const deadline = Number(challenge.votingDeadline) * 1000;
    const now = Date.now();
    const remaining = deadline - now;

    if (remaining <= 0) return "Voting ended";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  }, [challenge?.votingDeadline]);

  // Handle vote submission
  const handleVote = useCallback(() => {
    if (selectedVote === null) return;
    escrow.castVote(challengeId, selectedVote);
  }, [challengeId, selectedVote, escrow]);

  // Watch for vote completion
  useMemo(() => {
    if (escrow.isConfirmed && selectedVote !== null) {
      onVoteComplete?.(selectedVote);
    }
  }, [escrow.isConfirmed, selectedVote, onVoteComplete]);

  const isLoading = isChallengeLoading || isVotingLoading || isHasVotedLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-gray-200 bg-white p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <span className="ml-3 text-gray-600">Loading challenge...</span>
        </div>
      </div>
    );
  }

  // Challenge not found
  if (!challenge || challenge.user === "0x0000000000000000000000000000000000000000") {
    return (
      <div className={cn("rounded-2xl border border-gray-200 bg-white p-6", className)}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Challenge Not Found</h3>
          <p className="mt-2 text-gray-600">This challenge doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Check challenge state
  const isVotingActive = challenge.state === ChallengeState.FAILED_PENDING_INSURANCE;

  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white shadow-lg", className)}>
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{challengeTitle}</h2>
            {challengeDescription && (
              <p className="mt-1 text-gray-600">{challengeDescription}</p>
            )}
          </div>
          <div
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              challenge.state === ChallengeState.FAILED_PENDING_INSURANCE
                ? "bg-amber-100 text-amber-800"
                : challenge.state === ChallengeState.REMEDIATION_ACTIVE
                ? "bg-blue-100 text-blue-800"
                : challenge.state === ChallengeState.COMPLETED
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            )}
          >
            {ChallengeStateLabels[challenge.state]}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span>Amount: {formatUSDC(challenge.amount)}</span>
          {timeRemaining && isVotingActive && (
            <>
              <span>|</span>
              <span className="font-medium text-amber-600">{timeRemaining}</span>
            </>
          )}
        </div>
      </div>

      {/* Voting Progress */}
      {votingProgress && (
        <div className="border-b border-gray-100 p-6">
          <h3 className="mb-4 text-sm font-medium text-gray-700">
            Voting Progress ({votingProgress.totalVotes}/{votingProgress.totalGuarantors} voted)
          </h3>

          <div className="space-y-3">
            {/* Yes votes */}
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center text-green-600">
                  <ThumbsUpIcon className="mr-1 h-4 w-4" />
                  Approve PoR
                </span>
                <span className="font-medium">
                  {votingProgress.yesVotes} / {votingProgress.requiredVotes} needed
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${votingProgress.yesPercentage}%` }}
                />
              </div>
            </div>

            {/* No votes */}
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center text-red-600">
                  <ThumbsDownIcon className="mr-1 h-4 w-4" />
                  Reject PoR
                </span>
                <span className="font-medium">{votingProgress.noVotes}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-red-500 transition-all"
                  style={{ width: `${votingProgress.noPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voting Section */}
      <div className="p-6">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="mb-4 text-gray-600">Connect your wallet to vote</p>
            <ConnectWallet />
          </div>
        ) : !isGuarantor ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Not a Guarantor</h3>
            <p className="mt-2 text-center text-gray-600">
              Only designated guarantors can vote on this challenge.
            </p>
          </div>
        ) : !isVotingActive ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ClockIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Voting Not Active</h3>
            <p className="mt-2 text-center text-gray-600">
              {challenge.state === ChallengeState.ACTIVE
                ? "The challenge is still in progress."
                : challenge.state === ChallengeState.REMEDIATION_ACTIVE
                ? "Path of Redemption was approved. The user has a second chance."
                : "Voting for this challenge has ended."}
            </p>
          </div>
        ) : hasVoted ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Vote Submitted</h3>
            <p className="mt-2 text-center text-gray-600">
              Thank you for voting! Waiting for other guarantors...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Cast Your Vote
              </h3>
              <p className="text-sm text-gray-600">
                Should {challenge.user.slice(0, 8)}... be given a Path of Redemption
                (second chance)?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedVote(true)}
                className={cn(
                  "flex flex-col items-center rounded-xl border-2 p-6 transition-all",
                  selectedVote === true
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                )}
              >
                <div
                  className={cn(
                    "mb-3 flex h-14 w-14 items-center justify-center rounded-full",
                    selectedVote === true ? "bg-green-500" : "bg-green-100"
                  )}
                >
                  <ThumbsUpIcon
                    className={cn(
                      "h-7 w-7",
                      selectedVote === true ? "text-white" : "text-green-600"
                    )}
                  />
                </div>
                <span className="font-semibold text-gray-900">Approve</span>
                <span className="text-xs text-gray-500">Grant second chance</span>
              </button>

              <button
                onClick={() => setSelectedVote(false)}
                className={cn(
                  "flex flex-col items-center rounded-xl border-2 p-6 transition-all",
                  selectedVote === false
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-red-300 hover:bg-red-50/50"
                )}
              >
                <div
                  className={cn(
                    "mb-3 flex h-14 w-14 items-center justify-center rounded-full",
                    selectedVote === false ? "bg-red-500" : "bg-red-100"
                  )}
                >
                  <ThumbsDownIcon
                    className={cn(
                      "h-7 w-7",
                      selectedVote === false ? "text-white" : "text-red-600"
                    )}
                  />
                </div>
                <span className="font-semibold text-gray-900">Reject</span>
                <span className="text-xs text-gray-500">Forfeit funds</span>
              </button>
            </div>

            {escrow.writeError && (
              <p className="text-sm text-red-600">
                Error: {escrow.writeError.message}
              </p>
            )}

            <button
              onClick={handleVote}
              disabled={
                selectedVote === null ||
                escrow.isWritePending ||
                escrow.isConfirming
              }
              className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {escrow.isWritePending || escrow.isConfirming ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {escrow.isConfirming ? "Confirming..." : "Submitting..."}
                </span>
              ) : (
                "Submit Vote"
              )}
            </button>

            <p className="text-center text-xs text-gray-500">
              Your vote is final and cannot be changed once submitted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Icons
function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function ThumbsUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  );
}

function ThumbsDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

export default GuarantorVoting;
