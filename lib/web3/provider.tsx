"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { type ReactNode, useState } from "react";
import { wagmiConfig } from "./config";

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time for blockchain data
            staleTime: 5 * 1000, // 5 seconds
            // Retry failed queries
            retry: 2,
            // Refetch on window focus for real-time data
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
