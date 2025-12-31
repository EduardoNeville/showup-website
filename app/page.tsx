 import { Hero } from '../components/Hero';
 import { FeatureCard } from '../components/FeatureCard';
 import Letter3DSwap from '../components/fancy/text/letter-3d-swap';
 import Timeline from '../components/Timeline';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero />

        {/* How It Works */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
             <Letter3DSwap as="h2" mainClassName="text-3xl md:text-4xl font-serif font-bold text-center mb-12 animate-fade-in-left" staggerDuration={0.02}>
               How It Works
             </Letter3DSwap>
             <Timeline />
         </div>
       </section>

       {/* Features */}
       <section className="py-16 px-4 bg-muted">
         <div className="max-w-6xl mx-auto">
            <Letter3DSwap as="h2" mainClassName="text-3xl md:text-4xl font-serif font-bold text-center mb-12 animate-fade-in-right" staggerDuration={0.02}>
              Key Features
            </Letter3DSwap>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-right">
              <FeatureCard
                title="Crypto & Fiat Escrow"
                description="Secure deposits with blockchain escrow or traditional payments."
              />
              <FeatureCard
                title="Decentralized Verification"
                description="Friends confirm completion using verifiable credentials."
              />
              <FeatureCard
                title="Social Incentives"
                description="Friends buy shares to motivate you, with real stakes."
              />
          </div>
        </div>
      </section>

       {/* FAQ */}
       <section className="py-16 px-4">
         <div className="max-w-4xl mx-auto">
            <Letter3DSwap as="h2" mainClassName="text-3xl md:text-4xl font-serif font-bold text-center mb-12 animate-fade-in-left" staggerDuration={0.02}>
              FAQ
            </Letter3DSwap>
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
