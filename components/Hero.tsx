import VerticalCutReveal from "./fancy/text/vertical-cut-reveal";

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 sm:px-8 lg:px-12 py-12 md:py-0">
      <div className="text-center max-w-5xl mx-auto animate-fade-in-up">
        {/* Logo */}
        <div className="flex justify-center mb-6 md:mb-8">
          <img
            src="/showup-icon.svg"
            alt="Showup Icon"
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 drop-shadow-lg"
          />
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-foreground mb-4 md:mb-6 leading-tight">
          <VerticalCutReveal
            splitBy="words"
            staggerFrom="first"
            staggerDuration={0.15}
          >
            Turn Challenges into Commitments
          </VerticalCutReveal>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
          Deposit funds, invite friends as guarantors, and stay accountable to
          your goals.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
          <button className="w-full sm:w-auto px-8 py-3.5 md:px-10 md:py-4 bg-primary text-primary-foreground rounded-xl font-medium text-base md:text-lg neumorphic hover:scale-105 hover:shadow-lg transition-all duration-300">
            Download App
          </button>
          <button className="w-full sm:w-auto px-8 py-3.5 md:px-10 md:py-4 border-2 border-border rounded-xl font-medium text-base md:text-lg neumorphic-inset hover:bg-muted hover:border-primary/50 transition-all duration-300">
            Learn How It Works
          </button>
        </div>

        {/* Optional: Trust indicator */}
        <p className="mt-8 md:mt-12 text-sm text-muted-foreground/70">
          Join thousands building better habits together
        </p>
      </div>
    </section>
  );
}
