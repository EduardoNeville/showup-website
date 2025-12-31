# Showup - Personal Challenges with Real Stakes

Create accountable personal challenges with deposits and social incentives. Use fiat or crypto-backed escrow to motivate yourself with real consequences.

## Features

- **Crypto & Fiat Escrow**: Secure deposits using blockchain (USDC/USDT via Bitcart) or traditional payments (Stripe with Apple Pay).
- **Decentralized Verification**: Friends confirm challenge completion using verifiable credentials from Evernym Verity.
- **Social Incentives**: Friends can buy shares in your challenge, creating real stakes for motivation.
- **AI-Powered Challenge Creation**: Chat with AI to brainstorm and define your behavioral challenges.
- **Flexible Definitions**: Specify what, how, who, consistency, and when for your challenges.

## How It Works

1. **Terms & Services**: Accept terms and verify identity with decentralized credentials.
2. **AI Conversation**: Brainstorm your challenge with AI assistance.
3. **Definitions**: Define challenge details including goals, confirmation methods, deposit amounts, and frequency.
4. **Sharing**: Share your challenge link with friends who can view and invest in your success.
5. **Deposit**: Securely escrow funds via crypto or fiat payments.
6. **Verification & Completion**: Friends attest to completion; success releases funds, failure rewards investors.

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

- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **Fonts**: Geist (sans), Geist Mono (mono), Crimson Text (serif)
- **Icons**: Lucide React, custom SVG icons
- **Payments**: Stripe (fiat), Bitcart (crypto)
- **Verification**: Evernym Verity (decentralized credentials)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

Deploy easily on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with one click

For more details, see [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Contributing

Contributions are welcome! Please open issues and pull requests on GitHub.

## License

© 2025 Showup. All rights reserved.