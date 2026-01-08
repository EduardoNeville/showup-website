/**
 * Smart Contract Types and ABIs for Showup Challenge Escrow
 */

// ============ Enums ============

export enum ChallengeState {
  ACTIVE = 0,
  COMPLETED = 1,
  FAILED_PENDING_INSURANCE = 2,
  REMEDIATION_ACTIVE = 3,
  FAILED_FINAL = 4,
}

export const ChallengeStateLabels: Record<ChallengeState, string> = {
  [ChallengeState.ACTIVE]: "Active",
  [ChallengeState.COMPLETED]: "Completed",
  [ChallengeState.FAILED_PENDING_INSURANCE]: "Pending Guarantor Vote",
  [ChallengeState.REMEDIATION_ACTIVE]: "Path of Redemption",
  [ChallengeState.FAILED_FINAL]: "Failed",
};

// ============ Types ============

export interface Challenge {
  user: `0x${string}`;
  amount: bigint;
  state: ChallengeState;
  createdAt: bigint;
  endTime: bigint;
  votingDeadline: bigint;
  remediationDeadline: bigint;
  metadataUri: string;
}

export interface VotingState {
  guarantors: `0x${string}`[];
  yesVotes: bigint;
  noVotes: bigint;
  requiredVotes: bigint;
}

export interface ChallengeMetadata {
  title: string;
  description: string;
  category: string;
  frequency: string;
  startDate: string;
  endDate: string;
}

// ============ Contract Addresses ============

export const CONTRACT_ADDRESSES = {
  // Polygon Mainnet
  137: {
    challengeEscrow: "0x0000000000000000000000000000000000000000" as `0x${string}`, // Deploy address TBD
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as `0x${string}`, // Native USDC on Polygon
  },
  // Polygon Amoy Testnet
  80002: {
    challengeEscrow: "0x0000000000000000000000000000000000000000" as `0x${string}`, // Deploy address TBD
    usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" as `0x${string}`, // Test USDC
  },
  // Base Mainnet
  8453: {
    challengeEscrow: "0x0000000000000000000000000000000000000000" as `0x${string}`, // Deploy address TBD
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`, // Native USDC on Base
  },
  // Base Sepolia Testnet
  84532: {
    challengeEscrow: "0x0000000000000000000000000000000000000000" as `0x${string}`, // Deploy address TBD
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`, // Test USDC
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

// ============ ABIs ============

export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export const CHALLENGE_ESCROW_ABI = [
  // ============ Events ============
  {
    type: "event",
    name: "ChallengeCreated",
    inputs: [
      { name: "challengeId", type: "bytes32", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "guarantors", type: "address[]", indexed: false },
      { name: "endTime", type: "uint256", indexed: false },
      { name: "metadataUri", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ChallengeStateChanged",
    inputs: [
      { name: "challengeId", type: "bytes32", indexed: true },
      { name: "previousState", type: "uint8", indexed: false },
      { name: "newState", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { name: "challengeId", type: "bytes32", indexed: true },
      { name: "guarantor", type: "address", indexed: true },
      { name: "approveRedemption", type: "bool", indexed: false },
      { name: "yesVotes", type: "uint256", indexed: false },
      { name: "noVotes", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "FundsReleased",
    inputs: [
      { name: "challengeId", type: "bytes32", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "FundsForfeited",
    inputs: [
      { name: "challengeId", type: "bytes32", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RemediationStarted",
    inputs: [
      { name: "challengeId", type: "bytes32", indexed: true },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },

  // ============ Read Functions ============
  {
    name: "getChallenge",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "challengeId", type: "bytes32" }],
    outputs: [
      { name: "user", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "state", type: "uint8" },
      { name: "createdAt", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "votingDeadline", type: "uint256" },
      { name: "remediationDeadline", type: "uint256" },
      { name: "metadataUri", type: "string" },
    ],
  },
  {
    name: "getVotingState",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "challengeId", type: "bytes32" }],
    outputs: [
      { name: "guarantors", type: "address[]" },
      { name: "yesVotes", type: "uint256" },
      { name: "noVotes", type: "uint256" },
      { name: "requiredVotes", type: "uint256" },
    ],
  },
  {
    name: "hasVoted",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "challengeId", type: "bytes32" },
      { name: "voter", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getVote",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "challengeId", type: "bytes32" },
      { name: "voter", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "usdcToken",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "VOTING_PERIOD",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "REMEDIATION_PERIOD",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "MIN_DEPOSIT",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "MAX_DEPOSIT",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "platformFeeBps",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  // ============ Write Functions ============
  {
    name: "createChallenge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "challengeId", type: "bytes32" },
      { name: "_guarantors", type: "address[]" },
      { name: "_amount", type: "uint256" },
      { name: "_duration", type: "uint256" },
      { name: "_metadataUri", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "reportFailure",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "challengeId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "castVote",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "challengeId", type: "bytes32" },
      { name: "approveRedemption", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "finalizeVoting",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "challengeId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "completeChallenge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "challengeId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "finalizeRemediation",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "challengeId", type: "bytes32" }],
    outputs: [],
  },
] as const;

// ============ Utility Functions ============

/**
 * Generate a challenge ID from components
 */
export function generateChallengeId(
  user: `0x${string}`,
  timestamp: number,
  nonce: number
): `0x${string}` {
  // In production, use keccak256 hash
  const combined = `${user}-${timestamp}-${nonce}`;
  // Simple hash for demo - replace with proper keccak256
  const hash = Array.from(combined)
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString(16)
    .padStart(64, "0");
  return `0x${hash}` as `0x${string}`;
}

/**
 * Format USDC amount (6 decimals) to human readable
 */
export function formatUSDC(amount: bigint): string {
  const formatted = Number(amount) / 1_000_000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(formatted);
}

/**
 * Parse human readable amount to USDC units (6 decimals)
 */
export function parseUSDC(amount: string | number): bigint {
  return BigInt(Math.round(Number(amount) * 1_000_000));
}

/**
 * Get contract addresses for a chain
 */
export function getContractAddresses(chainId: number) {
  if (chainId in CONTRACT_ADDRESSES) {
    return CONTRACT_ADDRESSES[chainId as SupportedChainId];
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
}
