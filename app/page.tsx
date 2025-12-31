import { Hero } from '../components/Hero';
import { StepCard } from '../components/StepCard';
import { FeatureCard } from '../components/FeatureCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero />

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <StepCard
              step={1}
              title="Terms & Services"
              description="First-time users: Accept terms and verify identity via Evernym Verity for decentralized credentials."
            />
            <StepCard
              step={2}
              title="AI Conversation"
              description="Chat with AI to brainstorm and define your behavioral challenge."
            />
            <StepCard
              step={3}
              title="Definitions"
              description="Specify your challenge details."
              details={[
                "What: Define behavioral goals for internalization.",
                "How: Specify friend confirmation method.",
                "Who: Choose deposit amount, link to friend's challenge.",
                "Consistency: Set notifications and reminders.",
                "When: Define activity frequency."
              ]}
            />
            <StepCard
              step={4}
              title="Sharing"
              description="Share challenge link with friends. They can view and buy shares to incentivize you."
            />
            <StepCard
              step={5}
              title="Deposit"
              description="Pay via Bitcart (crypto: USDC/USDT) or Stripe (fiat: Apple Pay). Funds escrowed securely."
            />
            <StepCard
              step={6}
              title="Verification & Completion"
              description="Friends attest via Verity credentials. Success releases funds; failure rewards sharers."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Crypto & Fiat Escrow"
              description="Secure deposits with blockchain escrow or traditional payments."
              icon="🔐"
            />
            <FeatureCard
              title="Decentralized Verification"
              description="Friends confirm completion using verifiable credentials."
              icon="✅"
            />
            <FeatureCard
              title="Social Incentives"
              description="Friends buy shares to motivate you, with real stakes."
              icon="👥"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-6">
            <details className="neumorphic p-4 rounded-lg">
              <summary className="font-semibold cursor-pointer">How do crypto wallets work?</summary>
              <p className="mt-2 text-muted-foreground">Users connect wallets like MetaMask for USDC/USDT deposits. Funds are escrowed via Bitcart.</p>
            </details>
            <details className="neumorphic p-4 rounded-lg">
              <summary className="font-semibold cursor-pointer">What are the fees?</summary>
              <p className="mt-2 text-muted-foreground">Crypto: Minimal tx fees. Fiat: Stripe ~2.9% + $0.30. Self-hosted for cost-efficiency.</p>
            </details>
            <details className="neumorphic p-4 rounded-lg">
              <summary className="font-semibold cursor-pointer">How are disputes handled?</summary>
              <p className="mt-2 text-muted-foreground">Decentralized verification prevents disputes; credentials ensure trustless confirmations.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-muted text-center">
        <p className="text-muted-foreground">© 2025 Showup. <a href="#" className="underline">Privacy</a> | <a href="#" className="underline">Terms</a></p>
      </footer>
    </div>
  );
}
