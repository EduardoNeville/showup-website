# Guarantor Model Implementation

## Overview

This implementation provides a complete Web 2.5 hybrid architecture for the Showup challenge escrow system, combining:
- **Smart Contract Escrow** for trustless fund management
- **Stripe Crypto Onramp** for fiat-to-crypto conversion
- **wagmi/viem** for React wallet integration

## Architecture

```
User (Fiat) → Stripe Onramp → User Wallet (USDC) → Smart Contract Escrow
                                                          ↓
                                              Guarantor Voting (PoR)
                                                          ↓
                                              Success → Return to User
                                              Failure → Treasury
```

## Files Created

### Smart Contract
- `contracts/ChallengeEscrow.sol` - Solidity contract implementing:
  - Challenge states: ACTIVE, COMPLETED, FAILED_PENDING_INSURANCE, REMEDIATION_ACTIVE, FAILED_FINAL
  - USDC deposit and escrow
  - Guarantor voting with simple majority
  - Path of Redemption (PoR) mechanism
  - 24h voting period, 7-day remediation period

### TypeScript Types & ABIs
- `types/contracts.ts` - Contract types, ABIs, and utility functions:
  - ChallengeState enum
  - Challenge and VotingState interfaces
  - ERC20 and ChallengeEscrow ABIs
  - Contract addresses for Polygon and Base (mainnet + testnet)
  - Helper functions: `formatUSDC`, `parseUSDC`, `generateChallengeId`

### Web3 Configuration
- `lib/web3/config.ts` - wagmi configuration:
  - Support for Polygon, Polygon Amoy, Base, Base Sepolia
  - Connectors: MetaMask (injected), Coinbase Wallet, WalletConnect
  - Alchemy RPC with public fallbacks
- `lib/web3/provider.tsx` - React context provider for wagmi
- `lib/web3/hooks/useWallet.ts` - Wallet connection hook
- `lib/web3/hooks/useChallengeEscrow.ts` - Contract interaction hook

### Stripe Integration
- `lib/stripe/onramp.ts` - Onramp utilities and types
- `app/api/stripe/onramp/route.ts` - API route for creating onramp sessions
- `app/api/stripe/webhook/route.ts` - Webhook handler for onramp events

### React Components
- `components/web3/ConnectWallet.tsx` - Wallet connection button with modal
- `components/web3/StripeOnramp.tsx` - Embedded Stripe Crypto Onramp widget
- `components/web3/ChallengeDeposit.tsx` - Complete deposit flow:
  1. Connect wallet
  2. Select amount
  3. Add guarantors
  4. Choose funding (existing USDC or buy via Stripe)
  5. Approve USDC spending
  6. Deposit to escrow
- `components/web3/GuarantorVoting.tsx` - Voting interface for guarantors

### Demo Page
- `app/challenge/page.tsx` - Demo challenge creation page

### Configuration
- `.env.example` - Environment variables template

## Environment Variables

```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx
NEXT_PUBLIC_ALCHEMY_API_KEY=xxx
```

## Contract Deployment (Next Steps)

1. Install Foundry or Hardhat
2. Compile the contract
3. Deploy to testnet (Polygon Amoy or Base Sepolia)
4. Update contract addresses in `types/contracts.ts`
5. Verify contract on block explorer

### Foundry Deployment Example
```bash
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/ChallengeEscrow.sol:ChallengeEscrow \
  --constructor-args $USDC_ADDRESS $TREASURY_ADDRESS $OWNER_ADDRESS
```

## Stripe Onramp Setup

1. Apply for Crypto Onramp access at https://dashboard.stripe.com/crypto-onramp/onboarding
2. Configure allowed domains in Stripe Dashboard
3. Set up webhook endpoint: `/api/stripe/webhook`
4. Subscribe to `crypto.onramp_session_updated` events

## Usage Flow

### Creating a Challenge
1. User connects wallet (MetaMask, Coinbase, WalletConnect)
2. Selects deposit amount (e.g., $100 USDC)
3. Adds guarantor wallet addresses
4. Either:
   - Uses existing USDC balance, OR
   - Purchases USDC via Stripe (card/Apple Pay)
5. Approves USDC spending for escrow contract
6. Signs transaction to create challenge

### Guarantor Voting (On Failure)
1. User reports failure (or oracle triggers)
2. Challenge enters FAILED_PENDING_INSURANCE state
3. Guarantors have 24 hours to vote
4. Simple majority (>50%) approves Path of Redemption
5. If approved: User gets 7 days to complete redemption challenge
6. If rejected or timeout: Funds go to treasury

### Completing a Challenge
1. Guarantor (or user after end time) calls `completeChallenge`
2. Funds returned to user minus any platform fee
3. Challenge marked as COMPLETED

## Supported Networks

| Network | Chain ID | USDC Address |
|---------|----------|--------------|
| Polygon Mainnet | 137 | 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 |
| Polygon Amoy | 80002 | 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582 |
| Base Mainnet | 8453 | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 |
| Base Sepolia | 84532 | 0x036CbD53842c5426634e7929541eC2318f3dCF7e |

## Security Considerations

1. **Smart Contract**: Uses OpenZeppelin's SafeERC20 and ReentrancyGuard
2. **Escrow**: Funds locked in contract, not held by platform
3. **Voting**: Only designated guarantors can vote, one vote per address
4. **Timeouts**: Automatic state transitions after deadline
5. **Stripe**: All KYC/AML handled by Stripe, webhook signature verification

## Dependencies Added

```json
{
  "@tanstack/react-query": "^5.90.16",
  "wagmi": "^3.2.0",
  "viem": "2.x"
}
```

## Testing

1. Start dev server: `bun dev`
2. Visit `/challenge` to test the deposit flow
3. Use Polygon Amoy testnet for development
4. Get test USDC from a faucet or use Stripe sandbox

## Future Enhancements

- [ ] Oracle integration (Chainlink) for automatic success verification
- [ ] IPFS metadata storage for challenge details
- [ ] Push notifications for voting deadlines
- [ ] Mobile wallet deep links
- [ ] Multi-chain escrow synchronization
- [ ] Stablecoin payouts via Stripe Connect
