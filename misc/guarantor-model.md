# Guarantor Model

## Safety Nets & Second chances

**Scenario**:

Alice deposits $100 for a fitness challenge.

She chooses X guarantors (eg. Bob & Charlie) each receives 1 share
Recommended odd numbers but is optional

For each 1 friend = 1 share

This means that Bob & Charlie both have equal rights to verify Alice's challenge.

They also have the right to provide a Path of Redemption (PoR) if failure.

If Alice fails all members that have taken shares will have a say in the outcome.

| Event          | Alice's $100     | Guarantors role |
| -------------- | ---------------- | --------------- |
| Alice succeeds | Returns to Alice | Nothing         |
| Alice fails    | PoR              | Decides PoR     |

One-Shot Insurance: Only one PoR per challenge.

## Fallbacks (If guarantor doesn't respond)

TBD
Invite another person to be the guarantor

## Path of Redemption (PoR)

When a user fails the challenge a PoR is created.

This means that the user will have to talk about why they failed and

What should be the path to redemption. Decide on what the PoR challenge will be (multiple possible PoR) the guarantors vote on it (24h voting)

**Questions to answer:**

## Challenge States

1. ACTIVE
2. COMPLETED
3. FAILED_PENDING_INSURANCE: Guarantors vote on what the PoR should be
4. REMEDIATION_ACTIVE
5. FAILED_FINAL

```states-enums.ts
// Proposed State Enum for Challenge
enum ChallengeState {
  ACTIVE = 1,
  COMPLETED = 2,
  FAILED_PENDING_INSURANCE = 3, // "Purgatory"
  REMEDIATION_ACTIVE = 4,       // "Second Chance"
  FAILED_FINAL = 5
}
```

## Where are funds held

Stripe?
Nakama Wallet?
Smart Contract?

Smart Contracts could be very useful
