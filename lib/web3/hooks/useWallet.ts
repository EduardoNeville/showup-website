"use client";

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from "wagmi";
import { useCallback, useMemo } from "react";
import { defaultChain, supportedChains, chainMetadata, connectorMetadata } from "../config";
import type { Connector } from "wagmi";

/**
 * Custom hook for wallet connection and management
 */
export function useWallet() {
  const { address, isConnected, isConnecting, chain, connector } = useAccount();
  const { connect, connectors, isPending: isConnectPending, error: connectError } = useConnect();
  const { disconnect, isPending: isDisconnectPending } = useDisconnect();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();

  // Get native balance
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
  });

  // Check if on supported chain
  const isOnSupportedChain = useMemo(() => {
    if (!chain) return false;
    return supportedChains.some((c) => c.id === chain.id);
  }, [chain]);

  // Get current chain metadata
  const currentChainMeta = useMemo(() => {
    if (!chain) return null;
    return chainMetadata[chain.id] || null;
  }, [chain]);

  // Get available connectors with metadata
  const availableConnectors = useMemo(() => {
    return connectors.map((c: Connector) => ({
      ...c,
      meta: connectorMetadata[c.id] || {
        name: c.name,
        icon: "/wallets/default.svg",
        description: `Connect using ${c.name}`,
      },
    }));
  }, [connectors]);

  // Connect to wallet
  const connectWallet = useCallback(
    (connectorId?: string) => {
      const connector = connectorId
        ? connectors.find((c: Connector) => c.id === connectorId)
        : connectors[0];

      if (connector) {
        connect({ connector });
      }
    },
    [connect, connectors]
  );

  // Switch to default chain if on unsupported network
  const switchToDefaultChain = useCallback(() => {
    switchChain({ chainId: defaultChain.id });
  }, [switchChain]);

  // Truncate address for display
  const truncatedAddress = useMemo(() => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  return {
    // Connection state
    address,
    isConnected,
    isConnecting: isConnecting || isConnectPending,
    isDisconnecting: isDisconnectPending,
    isSwitchingChain: isSwitchPending,
    connectError,

    // Chain state
    chain,
    isOnSupportedChain,
    currentChainMeta,
    supportedChains,

    // Balance
    balance,
    isBalanceLoading,

    // Connectors
    connector,
    availableConnectors,

    // Actions
    connect: connectWallet,
    disconnect,
    switchChain,
    switchToDefaultChain,

    // Utilities
    truncatedAddress,
  };
}
