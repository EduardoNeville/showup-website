"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useCallback, useMemo } from "react";
import { keccak256, encodePacked } from "viem";
import {
  CHALLENGE_ESCROW_ABI,
  ERC20_ABI,
  CONTRACT_ADDRESSES,
  ChallengeState,
  type Challenge,
  type VotingState,
  formatUSDC,
  parseUSDC,
} from "@/types/contracts";

interface UseChallengeEscrowOptions {
  chainId: number;
}

/**
 * Hook for interacting with the ChallengeEscrow smart contract
 */
export function useChallengeEscrow({ chainId }: UseChallengeEscrowOptions) {
  const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  if (!contracts) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const escrowAddress = contracts.challengeEscrow;
  const usdcAddress = contracts.usdc;

  // Write contract hook
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction receipt
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // ============ Read Functions ============

  /**
   * Get challenge details
   */
  const useChallenge = (challengeId: `0x${string}` | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
      address: escrowAddress,
      abi: CHALLENGE_ESCROW_ABI,
      functionName: "getChallenge",
      args: challengeId ? [challengeId] : undefined,
      query: {
        enabled: !!challengeId,
      },
    });

    const challenge = useMemo((): Challenge | null => {
      if (!data) return null;
      const [user, amount, state, createdAt, endTime, votingDeadline, remediationDeadline, metadataUri] = data;
      return {
        user,
        amount,
        state: state as ChallengeState,
        createdAt,
        endTime,
        votingDeadline,
        remediationDeadline,
        metadataUri,
      };
    }, [data]);

    return { challenge, isLoading, error, refetch };
  };

  /**
   * Get voting state for a challenge
   */
  const useVotingState = (challengeId: `0x${string}` | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
      address: escrowAddress,
      abi: CHALLENGE_ESCROW_ABI,
      functionName: "getVotingState",
      args: challengeId ? [challengeId] : undefined,
      query: {
        enabled: !!challengeId,
      },
    });

    const votingState = useMemo((): VotingState | null => {
      if (!data) return null;
      const [guarantors, yesVotes, noVotes, requiredVotes] = data;
      return {
        guarantors: [...guarantors] as `0x${string}`[],
        yesVotes,
        noVotes,
        requiredVotes,
      };
    }, [data]);

    return { votingState, isLoading, error, refetch };
  };

  /**
   * Check if address has voted
   */
  const useHasVoted = (challengeId: `0x${string}` | undefined, voter: `0x${string}` | undefined) => {
    const { data, isLoading, error } = useReadContract({
      address: escrowAddress,
      abi: CHALLENGE_ESCROW_ABI,
      functionName: "hasVoted",
      args: challengeId && voter ? [challengeId, voter] : undefined,
      query: {
        enabled: !!challengeId && !!voter,
      },
    });

    return { hasVoted: data ?? false, isLoading, error };
  };

  /**
   * Get USDC balance
   */
  const useUSDCBalance = (address: `0x${string}` | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });

    return {
      balance: data ?? BigInt(0),
      formatted: data ? formatUSDC(data) : "$0.00",
      isLoading,
      error,
      refetch,
    };
  };

  /**
   * Get USDC allowance for escrow contract
   */
  const useUSDCAllowance = (owner: `0x${string}` | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: owner ? [owner, escrowAddress] : undefined,
      query: {
        enabled: !!owner,
      },
    });

    return {
      allowance: data ?? BigInt(0),
      isLoading,
      error,
      refetch,
    };
  };

  // ============ Write Functions ============

  /**
   * Approve USDC spending
   */
  const approveUSDC = useCallback(
    (amount: bigint) => {
      writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [escrowAddress, amount],
      });
    },
    [writeContract, usdcAddress, escrowAddress]
  );

  /**
   * Create a new challenge
   */
  const createChallenge = useCallback(
    (params: {
      challengeId: `0x${string}`;
      guarantors: `0x${string}`[];
      amount: bigint;
      duration: bigint;
      metadataUri: string;
    }) => {
      writeContract({
        address: escrowAddress,
        abi: CHALLENGE_ESCROW_ABI,
        functionName: "createChallenge",
        args: [
          params.challengeId,
          params.guarantors,
          params.amount,
          params.duration,
          params.metadataUri,
        ],
      });
    },
    [writeContract, escrowAddress]
  );

  /**
   * Report challenge failure
   */
  const reportFailure = useCallback(
    (challengeId: `0x${string}`) => {
      writeContract({
        address: escrowAddress,
        abi: CHALLENGE_ESCROW_ABI,
        functionName: "reportFailure",
        args: [challengeId],
      });
    },
    [writeContract, escrowAddress]
  );

  /**
   * Cast vote on Path of Redemption
   */
  const castVote = useCallback(
    (challengeId: `0x${string}`, approveRedemption: boolean) => {
      writeContract({
        address: escrowAddress,
        abi: CHALLENGE_ESCROW_ABI,
        functionName: "castVote",
        args: [challengeId, approveRedemption],
      });
    },
    [writeContract, escrowAddress]
  );

  /**
   * Complete a challenge
   */
  const completeChallenge = useCallback(
    (challengeId: `0x${string}`) => {
      writeContract({
        address: escrowAddress,
        abi: CHALLENGE_ESCROW_ABI,
        functionName: "completeChallenge",
        args: [challengeId],
      });
    },
    [writeContract, escrowAddress]
  );

  /**
   * Finalize voting after deadline
   */
  const finalizeVoting = useCallback(
    (challengeId: `0x${string}`) => {
      writeContract({
        address: escrowAddress,
        abi: CHALLENGE_ESCROW_ABI,
        functionName: "finalizeVoting",
        args: [challengeId],
      });
    },
    [writeContract, escrowAddress]
  );

  /**
   * Finalize remediation after deadline
   */
  const finalizeRemediation = useCallback(
    (challengeId: `0x${string}`) => {
      writeContract({
        address: escrowAddress,
        abi: CHALLENGE_ESCROW_ABI,
        functionName: "finalizeRemediation",
        args: [challengeId],
      });
    },
    [writeContract, escrowAddress]
  );

  // ============ Utilities ============

  /**
   * Generate a unique challenge ID
   */
  const generateChallengeId = useCallback(
    (user: `0x${string}`, timestamp: number, nonce: string): `0x${string}` => {
      return keccak256(
        encodePacked(["address", "uint256", "string"], [user, BigInt(timestamp), nonce])
      );
    },
    []
  );

  return {
    // Contract addresses
    escrowAddress,
    usdcAddress,

    // Read hooks
    useChallenge,
    useVotingState,
    useHasVoted,
    useUSDCBalance,
    useUSDCAllowance,

    // Write functions
    approveUSDC,
    createChallenge,
    reportFailure,
    castVote,
    completeChallenge,
    finalizeVoting,
    finalizeRemediation,

    // Transaction state
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    confirmError,
    resetWrite,

    // Utilities
    generateChallengeId,
    parseUSDC,
    formatUSDC,
  };
}
