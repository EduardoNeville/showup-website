# Development Plan for Showup Challenge App

## Overview

Showup is a mobile application where users create personal challenges with monetary stakes and social accountability. Users deposit funds (via Apple Pay or crypto) and invite friends as guarantors who verify completion and can safeguard funds by linking to their own challenges.

Based on the existing files (user flow, crypto specs, and current Next.js landing page), the best approach is to build a cross-platform mobile app using React Native, paired with a Node.js backend for handling logic, payments, and data.

## Tech Stack Recommendation

- **Frontend**: React Native (Expo for easier development and deployment)
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (self-hosted or managed like Supabase for simplicity)
- **Payments**:
  - Fiat (Apple Pay): Stripe API
  - Crypto (USDC/USDT): Bitcart self-hosted payment gateway + Ethereum node
- **Verification**: Evernym Verity for decentralized identity and credentials
- **Authentication**: Firebase Auth or custom JWT with PostgreSQL
- **Notifications**: Firebase Cloud Messaging or self-hosted options
- **Deployment**: App Store and Google Play for mobile; Heroku/Vercel/AWS for backend

## Key Features to Implement

1. **User Onboarding & Authentication**
   - Sign up/login with email/phone
   - Identity verification using Verity credentials (KYC-lite)

2. **Challenge Creation Flow** (based on userflow-new-challenge.md)
   - AI conversation for challenge ideation
   - Define challenge details, resolution methods, deposit amount
   - Set activity rate and notifications
   - Share challenge with friends

3. **Deposit System**
   - Choose payment method: Apple Pay (Stripe) or crypto (Bitcart)
   - Escrow funds until challenge completion
   - Generate unique addresses/sessions for deposits

4. **Social Incentives**
   - Invite friends as guarantors
   - Guarantors can buy shares in the challenge (linking to their own)
   - Friend confirmation via app (with Verity credentials for proof)

5. **Challenge Tracking & Verification**
   - In-app tracking of progress
   - Friend attestation for completion
   - Automatic fund release or redistribution on success/failure

6. **UI/UX**
   - Clean, animated interface (leveraging Framer Motion experience from website)
   - Gamified elements for motivation

## Development Phases

### Phase 1: Foundation (1-2 weeks)

- Set up React Native project with Expo
- Implement basic navigation and screens
- Set up Node.js backend with PostgreSQL
- Basic user auth

### Phase 2: Core Challenge Flow (2-3 weeks)

- Implement challenge creation UI and AI conversation (integrate with OpenAI API)
- Add deposit selection and mock payments
- Friend invitation system

### Phase 3: Payments Integration (2-4 weeks)

- Integrate Stripe for Apple Pay
- Set up Bitcart and Ethereum node for crypto
- Implement escrow logic

### Phase 4: Social & Verification (2-3 weeks)

- Add Verity for credentials
- Implement friend confirmation flow
- Fund release/distribution logic

### Phase 5: Testing & Deployment (1-2 weeks)

- End-to-end testing
- Submit to app stores
- Monitor and iterate

## Risks & Considerations

- **Regulatory**: Ensure compliance with financial regulations; consult legal for crypto/fiat handling
- **Security**: Use secure key management; audit code for vulnerabilities
- **Scalability**: Start with managed services (Supabase for DB); scale to self-hosted as needed
- **User Adoption**: Focus on UX to make complex features (crypto, credentials) accessible
- **Costs**: Budget for self-hosted infrastructure (~$100-200/month); payment fees (Stripe ~2.9%, crypto tx minimal)

## Next Steps

1. Confirm tech stack and tools
2. Set up development environments
3. Begin Phase 1 implementation
4. Regularly review and update this plan as development progresses

This plan leverages the detailed crypto specs and user flow while building on the existing website foundation for consistent branding.

