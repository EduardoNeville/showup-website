import VerticalCutReveal from "./fancy/text/vertical-cut-reveal";

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted px-4">
      <div className="text-center max-w-4xl animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6">
          <VerticalCutReveal
            splitBy="words"
            staggerFrom="first"
            staggerDuration={0.15}
          >
            Showup: Turn Challenges into Commitments
          </VerticalCutReveal>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Deposit funds, invite friends as guarantors, and stay accountable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg neumorphic hover:scale-105 transition-transform">
            Download App
          </button>
          <button className="px-8 py-3 border border-border rounded-lg neumorphic-inset hover:bg-muted transition-colors">
            Learn How It Works
          </button>
        </div>
      </div>
    </section>
  );
}

