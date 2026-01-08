"use client";

import { useState } from "react";
import { useWallet } from "@/lib/web3/hooks/useWallet";
import { cn } from "@/lib/utils";

interface ConnectWalletProps {
  className?: string;
  showBalance?: boolean;
  showChain?: boolean;
}

export function ConnectWallet({
  className,
  showBalance = false,
  showChain = true,
}: ConnectWalletProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    address,
    isConnected,
    isConnecting,
    isOnSupportedChain,
    truncatedAddress,
    balance,
    currentChainMeta,
    availableConnectors,
    connect,
    disconnect,
    switchToDefaultChain,
  } = useWallet();

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isConnecting}
          className={cn(
            "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          {isConnecting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Connecting...
            </>
          ) : (
            <>
              <WalletIcon className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </button>

        {/* Connector Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Connect Wallet
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-6 text-sm text-gray-600">
                Connect your wallet to deposit funds and participate in
                challenges.
              </p>

              <div className="space-y-3">
                {availableConnectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => {
                      connect(connector.id);
                      setIsModalOpen(false);
                    }}
                    className="flex w-full items-center rounded-xl border border-gray-200 p-4 transition-all hover:border-blue-500 hover:bg-blue-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <WalletIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-4 text-left">
                      <p className="font-medium text-gray-900">
                        {connector.meta.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {connector.meta.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-gray-500">
                By connecting, you agree to our Terms of Service
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Connected but on wrong chain
  if (!isOnSupportedChain) {
    return (
      <button
        onClick={switchToDefaultChain}
        className={cn(
          "inline-flex items-center rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white shadow transition-all hover:bg-yellow-600",
          className
        )}
      >
        <AlertIcon className="mr-2 h-4 w-4" />
        Switch Network
      </button>
    );
  }

  // Connected - show address and options
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showChain && currentChainMeta && (
        <div className="flex items-center rounded-lg bg-gray-100 px-3 py-2">
          <span className="text-sm font-medium text-gray-700">
            {currentChainMeta.name}
          </span>
          {currentChainMeta.isTestnet && (
            <span className="ml-2 rounded bg-yellow-200 px-1.5 py-0.5 text-xs font-medium text-yellow-800">
              Testnet
            </span>
          )}
        </div>
      )}

      {showBalance && balance && (
        <div className="rounded-lg bg-gray-100 px-3 py-2">
          <span className="text-sm font-medium text-gray-700">
            {(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} {balance.symbol}
          </span>
        </div>
      )}

      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800"
      >
        <div className="mr-2 h-2 w-2 rounded-full bg-green-400" />
        {truncatedAddress}
      </button>

      {/* Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Account</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-xs text-gray-500">Connected Address</p>
              <p className="font-mono text-sm text-gray-900">{address}</p>
            </div>

            <button
              onClick={() => {
                disconnect();
                setIsModalOpen(false);
              }}
              className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-100"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple SVG icons
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

export default ConnectWallet;
