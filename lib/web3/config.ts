import { http, createConfig, createStorage } from "wagmi";
import { polygon, polygonAmoy, base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

// Environment variables
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";

// Supported chains configuration
export const supportedChains = [
  polygon,
  polygonAmoy,
  base,
  baseSepolia,
] as const;

export type SupportedChain = (typeof supportedChains)[number];

// Default chain based on environment
export const defaultChain =
  process.env.NODE_ENV === "production" ? polygon : polygonAmoy;

// Chain metadata for UI
export const chainMetadata: Record<
  number,
  { name: string; icon: string; isTestnet: boolean }
> = {
  [polygon.id]: { name: "Polygon", icon: "/chains/polygon.svg", isTestnet: false },
  [polygonAmoy.id]: { name: "Polygon Amoy", icon: "/chains/polygon.svg", isTestnet: true },
  [base.id]: { name: "Base", icon: "/chains/base.svg", isTestnet: false },
  [baseSepolia.id]: { name: "Base Sepolia", icon: "/chains/base.svg", isTestnet: true },
};

// RPC URLs with fallbacks
const getRpcUrl = (chainId: number): string => {
  const alchemyUrls: Record<number, string> = {
    [polygon.id]: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    [polygonAmoy.id]: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    [base.id]: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    [baseSepolia.id]: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  };

  if (ALCHEMY_API_KEY && alchemyUrls[chainId]) {
    return alchemyUrls[chainId];
  }

  // Fallback to public RPCs
  const publicUrls: Record<number, string> = {
    [polygon.id]: "https://polygon-rpc.com",
    [polygonAmoy.id]: "https://rpc-amoy.polygon.technology",
    [base.id]: "https://mainnet.base.org",
    [baseSepolia.id]: "https://sepolia.base.org",
  };

  return publicUrls[chainId] || "";
};

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    coinbaseWallet({
      appName: "Showup",
      appLogoUrl: "https://showup.lifestyle/logo.png",
    }),
    ...(WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: WALLETCONNECT_PROJECT_ID,
            metadata: {
              name: "Showup",
              description: "Challenge yourself, backed by friends",
              url: "https://showup.lifestyle",
              icons: ["https://showup.lifestyle/logo.png"],
            },
          }),
        ]
      : []),
  ],
  transports: {
    [polygon.id]: http(getRpcUrl(polygon.id)),
    [polygonAmoy.id]: http(getRpcUrl(polygonAmoy.id)),
    [base.id]: http(getRpcUrl(base.id)),
    [baseSepolia.id]: http(getRpcUrl(baseSepolia.id)),
  },
  // Storage for persisting wallet connection
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    key: "showup-wallet",
  }),
  // SSR support
  ssr: true,
});

// Connector metadata for UI
export const connectorMetadata: Record<
  string,
  { name: string; icon: string; description: string }
> = {
  injected: {
    name: "Browser Wallet",
    icon: "/wallets/metamask.svg",
    description: "Connect using MetaMask or other browser wallets",
  },
  coinbaseWalletSDK: {
    name: "Coinbase Wallet",
    icon: "/wallets/coinbase.svg",
    description: "Connect using Coinbase Wallet",
  },
  walletConnect: {
    name: "WalletConnect",
    icon: "/wallets/walletconnect.svg",
    description: "Connect using WalletConnect",
  },
};

// Export chain IDs for convenience
export const CHAIN_IDS = {
  POLYGON: polygon.id,
  POLYGON_AMOY: polygonAmoy.id,
  BASE: base.id,
  BASE_SEPOLIA: baseSepolia.id,
} as const;
