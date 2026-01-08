# Showup - Personal Challenges with Real Stakes

Create accountable personal challenges with deposits and social incentives. Use fiat or crypto-backed escrow to motivate yourself with real consequences.

## Features

- **Web 2.5 Hybrid Architecture**: Combines the best of Web2 UX with Web3 security through smart contract escrow
- **Smart Contract Escrow**: Funds held in audited Solidity contracts, not by the platform
- **Guarantor Model**: Friends become guarantors who verify completion and can grant "Path of Redemption" (PoR) second chances
- **Stripe Crypto Onramp**: Buy USDC directly with credit cards (Apple Pay, Google Pay) without exchanges
- **Multi-Chain Support**: Polygon and Base networks for low-cost, fast transactions
- **Wallet Integration**: MetaMask, Coinbase Wallet, and WalletConnect support
- **Path of Redemption**: Guarantors vote on second chances when challenges fail
- **Flexible Verification**: Friends attest to completion with social accountability

## How It Works

### Challenge Creation Flow

1. **Connect Wallet**: Link MetaMask, Coinbase, or WalletConnect
2. **Define Challenge**: Set title, description, duration, and deposit amount
3. **Add Guarantors**: Choose friends who will verify and vote on your success
4. **Fund Challenge**: Use existing USDC or buy with card via Stripe
5. **Smart Contract Deposit**: Funds locked in escrow for the challenge duration

### Challenge States

- **ACTIVE**: Challenge in progress, funds held in escrow
- **COMPLETED**: Success! Funds returned to user
- **FAILED_PENDING_INSURANCE**: User failed, guarantors vote on Path of Redemption
- **REMEDIATION_ACTIVE**: Second chance granted, user has additional time
- **FAILED_FINAL**: No redemption, funds forfeited to treasury

### Path of Redemption (PoR)

When a challenge fails, guarantors have 24 hours to vote on whether to grant a second chance. A simple majority (>50%) can approve redemption, giving the user 7 additional days to complete their challenge.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd showup-website
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

### Frontend

- **Framework**: Next.js 16+ with App Router
- **Styling**: Tailwind CSS 4
- **Fonts**: Geist (sans), Geist Mono (mono), Crimson Text (serif)
- **Icons**: Lucide React, custom SVG icons
- **Package Manager**: Bun

### Web3 Integration

- **wagmi**: React hooks for Ethereum
- **viem**: TypeScript interface for Ethereum
- **Smart Contracts**: Solidity with OpenZeppelin
- **Networks**: Polygon & Base (mainnet + testnet)
- **Wallets**: MetaMask, Coinbase Wallet, WalletConnect

### Payments & Escrow

- **Stripe Crypto Onramp**: Fiat-to-crypto conversion
- **Stablecoin**: USDC on Polygon/Base
- **Smart Contract Escrow**: Trustless fund management

### Infrastructure

- **Deployment**: Docker + Traefik (production)
- **CI/CD**: GitHub Actions (planned)
- **Monitoring**: Vercel Analytics (planned)

## Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd showup-website
bun install  # or npm install
```

### 2. Environment Variables

Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Web3 Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

# Contract Addresses (after deployment)
NEXT_PUBLIC_ESCROW_ADDRESS_POLYGON_AMOY=0x...
```

### 3. Smart Contract Deployment

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Deploy to testnet
forge create --rpc-url $POLYGON_AMOY_RPC \
  --private-key $PRIVATE_KEY \
  contracts/ChallengeEscrow.sol:ChallengeEscrow \
  --constructor-args $USDC_ADDRESS $TREASURY_ADDRESS $OWNER_ADDRESS
```

### 4. Stripe Setup

1. Apply for Crypto Onramp: https://dashboard.stripe.com/crypto-onramp/onboarding
2. Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Subscribe to `crypto.onramp_session_updated` events

## Scripts

- `bun dev` - Start development server (recommended)
- `npm run dev` - Start development server
- `bun run build` - Build for production
- `npm run build` - Build for production
- `bun run start` - Start production server
- `npm run start` - Start production server
- `bun run lint` - Run ESLint
- `npm run lint` - Run ESLint

## Deployment Guide

The project includes Docker configuration for production deployment:

1. **Build and Deploy**

   ```bash
   # Build the application
   docker build -t showup-website .

   # Run with docker-compose
   docker-compose up -d
   ```

2. **Traefik Configuration**
   - The `docker-compose.yml` includes Traefik reverse proxy
   - Configure SSL certificates and domain routing
   - Update `showup.lifestyle` domain in traefik labels

### Environment-Specific Configurations

- **Development**: Uses Polygon Amoy testnet
- **Staging**: Uses Polygon mainnet with test Stripe keys
- **Production**: Uses Polygon mainnet with live Stripe keys

### Post-Deployment Checklist

- [ ] Smart contracts deployed to mainnet
- [ ] Contract addresses updated in environment
- [ ] Stripe webhook URL configured
- [ ] Domain SSL certificate active
- [ ] Environment variables set correctly
- [ ] Test wallet connections work
- [ ] Test Stripe onramp flow
- [ ] Verify contract interactions

## Testing

### Local Development

```bash
bun dev
# Visit http://localhost:3000/challenge
```

### Smart Contract Testing

```bash
# Install dependencies
cd contracts
npm install

# Run tests
npx hardhat test
```

### Wallet Testing

- Use MetaMask with Polygon Amoy testnet
- Get test USDC from faucets
- Test full challenge creation flow

## File Structure

```
showup-website/
├── app/                    # Next.js App Router
│   ├── api/stripe/        # Stripe API routes
│   ├── challenge/         # Challenge demo page
│   └── layout.tsx         # Root layout with Web3Provider
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── web3/             # Web3-specific components
├── contracts/            # Solidity smart contracts
├── lib/                  # Utility libraries
│   ├── stripe/           # Stripe utilities
│   └── web3/             # Web3 configuration & hooks
├── types/                # TypeScript type definitions
└── misc/                 # Documentation & planning
```

## Architecture Overview

### Web 2.5 Hybrid Flow

```
User (Fiat) → Stripe Crypto Onramp → User Wallet (USDC) → Smart Contract Escrow
                                                          ↓
                                              Guarantor Voting (PoR)
                                                          ↓
                                              Success → Return to User
                                              Failure → Treasury
```

### Key Components

1. **ChallengeEscrow.sol**: Smart contract managing challenge states, deposits, and voting
2. **Stripe Onramp**: Embedded widget for fiat-to-crypto conversion
3. **wagmi Integration**: React hooks for wallet connections and contract interactions
4. **Guarantor Voting**: Multi-signature style voting for Path of Redemption
5. **Multi-Chain Support**: Polygon & Base networks for optimal UX

### Security Features

- **Non-Custodial**: Funds held in smart contracts, not platform wallets
- **Trustless Voting**: On-chain voting with time-bound decisions
- **Stripe Compliance**: KYC/AML handled by Stripe for fiat onramp
- **OpenZeppelin Standards**: Audited, battle-tested smart contract patterns

## Contributing

### Development Guidelines

1. **Web3 Best Practices**: Follow wagmi and viem patterns
2. **Smart Contract Security**: Use OpenZeppelin libraries and audited patterns
3. **Type Safety**: Full TypeScript coverage for contracts and frontend
4. **Testing**: Unit tests for contracts, integration tests for frontend

### Smart Contract Development

```bash
# Install Foundry for contract development
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Test contracts
forge test

# Deploy to testnet
forge create --rpc-url $TESTNET_RPC \
  --private-key $PRIVATE_KEY \
  contracts/ChallengeEscrow.sol:ChallengeEscrow
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation
6. Submit pull request

## License

© 2025 Showup. All rights reserved.

## Links

- [Live Demo](https://showup.lifestyle) (coming soon)
- [Smart Contract Documentation](./contracts/README.md)
- [API Documentation](./app/api/README.md)
- [Stripe Crypto Onramp Docs](https://docs.stripe.com/crypto/onramp)
- [wagmi Documentation](https://wagmi.sh)
