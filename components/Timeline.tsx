import { FileText, MessageCircle, Settings, Share, CreditCard, CheckCircle } from "lucide-react";

const steps = [
  {
    title: "Terms & Services",
    description:
      "First-time users: Accept terms and verify identity via Evernym Verity for decentralized credentials.",
    details: [],
    icon: FileText,
  },
  {
    title: "AI Conversation",
    description:
      "Chat with AI to brainstorm and define your behavioral challenge.",
    details: [],
    icon: MessageCircle,
  },
  {
    title: "Definitions",
    description:
      "Specify your challenge details.",
    details: [
      "What: Define behavioral goals for internalization.",
      "How: Specify friend confirmation method.",
      "Who: Choose deposit amount, link to friend's challenge.",
      "Consistency: Set notifications and reminders.",
      "When: Define activity frequency."
    ],
    icon: Settings,
  },
  {
    title: "Sharing",
    description:
      "Share challenge link with friends. They can view and buy shares to incentivize you.",
    details: [],
    icon: Share,
  },
  {
    title: "Deposit",
    description:
      "Pay via Bitcart (crypto: USDC/USDT) or Stripe (fiat: Apple Pay). Funds escrowed securely.",
    details: [],
    icon: CreditCard,
  },
  {
    title: "Verification & Completion",
    description:
      "Friends attest via Verity credentials. Success releases funds; failure rewards sharers.",
    details: [],
    icon: CheckCircle,
  },
];

export default function Timeline() {
  return (
    <div className="max-w-(--breakpoint-sm) mx-auto py-12 md:py-20 px-6">
      <div className="relative ml-4">
        {/* Timeline line */}
        <div className="absolute left-0 inset-y-0 border-l-2" />

        {steps.map(
          (
            { description, details, title, icon: Icon },
            index
          ) => (
            <div key={index} className="relative pl-10 pb-12 last:pb-0">
              {/* Timeline Icon */}
              <div className="absolute left-px -translate-x-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-accent ring-8 ring-background">
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="pt-2 sm:pt-1 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.01em]">
                    {title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground text-pretty">
                  {description}
                </p>
                {details.length > 0 && (
                  <ul className="text-left text-base space-y-2">
                    {details.map((detail, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-primary mr-2 text-2xl">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}