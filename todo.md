- [ ] Smart Contract Deployment

1. What is my polygon amoy rpc
2. Deploy to testnet
   forge create --rpc-url $POLYGON_AMOY_RPC \
    --private-key $PRIVATE_KEY \
    contracts/ChallengeEscrow.sol:ChallengeEscrow \
    --constructor-args $USDC_ADDRESS $TREASURY_ADDRESS $OWNER_ADDRESS

- [ ] Stripe Setup

1. Apply for Crypto Onramp: https://dashboard.stripe.com/crypto-onramp/onboarding
2. Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Subscribe to `crypto.onramp_session_updated` events

- [x] Apple pay works
- [ ] Ai should automate the process of creating the challenge
- [ ] When you go to the link we should show them the exact challenge that your friend is linking you to it. And wether or not you will want to do this challenge too or create your own.
