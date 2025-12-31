Based on the user flow in `showup-misc/userflow-new-challenge.md`, I've analyzed the codebase (a Next.js React app with no existing crypto integrations) and researched best self-hosted services for stable coins (e.g., USDC/USDT), crypto wallets, verification systems, and related infrastructure. The challenge system involves monetary deposits for commitment, friend confirmations for completion, and share-buying for motivation—ideal for crypto integration to enable trustless, decentralized escrow and payouts.

Below is a comprehensive spec outlining how to combine these elements. This plan assumes a self-hosted approach for crypto components to ensure privacy, control, and cost-efficiency, avoiding third-party custodians. For fiat payments, a hybrid approach with Stripe is used due to regulatory constraints. I've prioritized open-source, secure, and scalable options based on research (e.g., Bitcart for crypto payments, Stripe for fiat, Verity for verification). Tradeoffs include higher setup complexity vs. reduced fees and compliance risks.

### Key Assumptions and Clarifications Needed

- **Stable Coins**: Focus on USDC/USDT for price stability (pegged to USD). Users deposit these as "skin in the game" for challenges.
- **Deposits/Shares**: Deposits are escrowed until challenge end. Friends buy shares (e.g., $1 = 1 share) to incentivize the user; if the user fails (no friend confirmation), deposits/shares go to successful sharers or a pool.
- **Verification**: "Verification systems" likely means identity verification (KYC-lite for users) and challenge proof verification (e.g., friend attestation). Not malware-related.
- **Self-Hosted**: All services run on your infrastructure (e.g., VPS/cloud). No reliance on exchanges like Coinbase.
- **Blockchain**: Ethereum/Polygon for stable coins (widely supported, low fees).
- **Compliance**: Ensure FATF Travel Rule compliance for crypto transfers (e.g., via wallet verification).
- Questions for you:
  - What blockchain(s) for stable coins (Ethereum mainnet for security, Polygon for speed/cheaper txns)?
  - How to handle challenge confirmation: Manual friend approval, or automated (e.g., photo proof via AI)?
  - Budget/resources for self-hosting (e.g., server costs ~$50-200/month)? Include Stripe fees?
  - User experience: Default to crypto or fiat? Provide both options?

### Recommended Self-Hosted Services

After researching (via web searches for self-hosted crypto tools), here are the best fits. All are open-source, non-custodial, and support stable coins/wallets.

1. **Payment Processor/Escrow for Stable Coins**: Bitcart (bitcart.ai)
   - Why: Self-hosted, open-source crypto payment gateway. Supports USDT/USDC on Ethereum/Tron/Binance Smart Chain. Handles deposits, escrow, and payouts without fees/intermediaries. Non-custodial (funds go directly to generated addresses).
   - Features: API for generating unique deposit addresses per challenge/share. Webhooks for confirmations. Integrates with wallets.
   - Setup: Docker-based, runs on Linux server. Requires blockchain RPC access.
   - Tradeoffs: Setup complexity (1-2 days); supports ~50 coins but focuses on stable coins.

2. **Crypto Wallets**: Integrate with Bitcart + Self-Hosted Ethereum Node
   - Why: Bitcart generates wallet addresses/keys. For full control, run a self-hosted Ethereum node (Geth or Erigon) and use web3.js/ethers.js for interactions. Avoids storing private keys (users sign txns via browser wallets like MetaMask).
   - Features: Address generation, balance checks, tx monitoring.
   - Setup: Node on server (e.g., via Docker); frontend connects via RPC.
   - Alternative: SHKeeper (shkeeper.io) for simpler gateway, but Bitcart is more robust for multi-coin.

3. **Verification Systems**: Evernym Verity (verity.evernym.com)
   - Why: Self-hosted, open-source platform for decentralized identity (DID) and verifiable credentials. Issue credentials for user identities (e.g., KYC proof) and challenge confirmations (e.g., friend attests "challenge completed"). Compliant with standards like W3C.
   - Features: SDK for issuing/verifying credentials. Self-hosted server for privacy.
   - Setup: Docker-based, runs on Linux. Integrates with wallets for signature-based verification.
   - Tradeoffs: Steeper learning curve; ideal for trustless confirmations (e.g., no central authority disputes).

4. **Fiat Payments (Apple Pay/Banking)**: Stripe (stripe.com)
   - Why: No fully self-hosted fiat processors exist due to banking regulations. Stripe supports Apple Pay, bank transfers (ACH), and escrow. Integrate via API for deposits/payouts.
   - Features: Webhooks for confirmations, holds funds in escrow. Supports USD.
   - Setup: API keys (not self-hosted, but server-side integration).
   - Tradeoffs: Fees (~2.9% + 30¢/txn); not self-hosted, but hybrid approach. Use for users without crypto wallets.

5. **Additional Infrastructure**:
   - **Database**: PostgreSQL (self-hosted) for storing challenge data, tx hashes, credentials.
   - **Notification System**: Self-hosted Matrix/Synapse for in-app notifications/reminders.
   - **Security**: Self-hosted Vault for secrets; fail2ban for server protection.

### High-Level Architecture

- **Frontend (Next.js)**: User interface for challenge creation, deposit prompts, wallet connections (e.g., via Wagmi/viem for Ethereum) or Stripe checkout for fiat. Displays QR codes for crypto, payment forms for fiat, credential requests.
- **Backend (Node.js/Express)**: Handles logic—calls Bitcart API for crypto payments, Stripe API for fiat, Verity for credentials, Ethereum node for tx validation. Stores data in DB.
- **Blockchain Layer**: Self-hosted Ethereum node monitors txns (e.g., deposit confirmations).
- **Flow** (Crypto or Fiat):
  1. User creates challenge → Chooses crypto or fiat → Backend generates Bitcart address/Stripe session → User pays.
  2. Deposits escrowed in Bitcart/Stripe.
  3. Friends buy shares → Similar payment flow.
  4. User verifies identity via Verity credential.
  5. Challenge ends → Friend issues completion credential → Backend verifies and releases funds.

### Detailed User Flow Integration

1. **Terms & Services (First-Time Users)**: On app load, prompt Verity-based identity verification (e.g., DID creation, basic proof like email/social link). Store credential in DB.

2. **AI Conversation**: Unchanged, but AI could suggest deposit amounts based on challenge type.

3. **Definitions**:
   - **Challenge (What)**: User inputs details; backend links to escrow.
   - **Resolution (How)**: Define confirmation method (e.g., "Friend must submit Verity credential with photo proof").
   - **Deposit (Who)**: User selects amount (e.g., 10 USDC or $10 USD). For crypto: Backend calls Bitcart to generate address; user scans QR/pays via wallet. For fiat: Backend creates Stripe checkout; user pays via Apple Pay/banking. Funds escrowed in Bitcart/Stripe.
   - **Notifications (Consistency)**: Self-hosted cron jobs send reminders (e.g., via email/SMS API).
   - **Activity Rate (When)**: User sets schedule; app tracks via notifications.

4. **Sharing**: Share challenge link. Friends view and buy shares (generate address via Bitcart, pay to escrow).

5. **Verification & Completion**:
   - Friend confirms: Issues Verity credential (e.g., "I attest user X completed Y on date Z").
   - Backend verifies credential against Verity.
   - If confirmed: Release deposit to user + rewards (e.g., from share pool). Else: Distribute to sharers.

### Technical Implementation Steps

1. **Setup Infrastructure**:
   - Provision server (e.g., AWS EC2 with Docker).
   - Install Bitcart, Verity, Ethereum node (Geth).
   - Configure APIs (e.g., Bitcart webhook URL).

2. **Backend Development**:
   - Add libraries: web3.js, Bitcart SDK, Verity SDK, Stripe SDK.
   - APIs: /create-challenge (generate address/session), /verify-credential, /release-funds.

3. **Frontend Development**:
   - Add wallet connect (e.g., MetaMask button) and Stripe Elements for fiat.
   - Integrate QR code generation for crypto, payment forms for fiat.

4. **Testing**:
   - Unit tests for tx logic.
   - Integration: Test on testnet (e.g., Sepolia for Ethereum).
   - Security audit: Ensure no key exposure.

5. **Deployment**:
   - Run on mainnet after testing.
   - Monitor with self-hosted Grafana/Prometheus.

### Risks & Mitigations

- **Security**: Use hardware security modules (HSMs) for keys. Regular audits.
- **Usability**: Provide wallet tutorials; fiat option via Stripe for non-crypto users.
- **Scalability**: Start small; scale nodes as needed.
- **Legal**: Consult lawyers for crypto regulations (e.g., AML/KYC via Verity); Stripe handles fiat compliance.
- **Costs**: Self-hosting ~$100/month; tx fees minimal with Polygon; Stripe fees ~2.9% + 30¢.

This spec provides a solid foundation. Do you want me to expand on any section, adjust services, or proceed to implementation once approved? Any preferences or additional constraints?
