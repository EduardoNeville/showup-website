"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  OnboardingStep,
  ChallengeDraft,
  AIMessage,
  SuggestedChallenge,
  ChallengeType,
  FrequencyType,
} from "@/types/onboarding";
import Letter3DSwap from "@/components/fancy/text/letter-3d-swap";
import { StripeCheckout } from "@/components/web3/StripeCheckout";
import {
  FileText,
  MessageCircle,
  Target,
  CheckCircle,
  DollarSign,
  Bell,
  Calendar,
  Share2,
  ChevronRight,
  ChevronLeft,
  Send,
  Sparkles,
  ArrowRight,
  Layers2,
} from "lucide-react";

const STEPS: { key: OnboardingStep; icon: typeof FileText; label: string }[] = [
  { key: "terms", icon: FileText, label: "Terms" },
  { key: "ai-chat", icon: MessageCircle, label: "Discover" },
  { key: "challenge-definition", icon: Target, label: "Define" },
  { key: "resolution", icon: CheckCircle, label: "Verify" },
  { key: "deposit", icon: DollarSign, label: "Commit" },
  { key: "notifications", icon: Bell, label: "Remind" },
  { key: "activity-rate", icon: Calendar, label: "Schedule" },
  { key: "sharing", icon: Share2, label: "Share" },
];

const CHALLENGE_TYPES: {
  value: ChallengeType;
  label: string;
  description: string;
}[] = [
  {
    value: "behavioral",
    label: "Behavioral",
    description: "Build a consistent habit or routine",
  },
  {
    value: "habit",
    label: "Daily Habit",
    description: "Something you'll do every day",
  },
  {
    value: "wellness",
    label: "Wellness",
    description: "Improve your physical or mental health",
  },
  {
    value: "fitness",
    label: "Fitness",
    description: "Exercise and physical activity",
  },
  {
    value: "learning",
    label: "Learning",
    description: "Develop new skills or knowledge",
  },
  {
    value: "productivity",
    label: "Productivity",
    description: "Work habits and focus",
  },
  {
    value: "consistency",
    label: "Consistency",
    description: "Show up regularly for something",
  },
  { value: "custom", label: "Custom", description: "Something unique to you" },
];

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "specific-days", label: "Specific days" },
];

const DURATION_OPTIONS = [
  { days: 7, label: "1 week", description: "Great for testing the waters" },
  { days: 14, label: "2 weeks", description: "Start seeing real results" },
  {
    days: 21,
    label: "3 weeks",
    description: "The classic habit-forming period",
  },
  { days: 30, label: "1 month", description: "Serious commitment" },
];

const DEPOSIT_OPTIONS = [
  { amount: 25, label: "$25", description: "A meaningful start" },
  { amount: 50, label: "$50", description: "Shows you're serious" },
  { amount: 100, label: "$100", description: "Real skin in the game" },
  { amount: 250, label: "$250", description: "Maximum commitment" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("terms");
  const [stepsCompleted, setStepsCompleted] = useState<OnboardingStep[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [showingPay, setShowingPay] = useState(false);
  const [copied, setCopied] = useState(false);
  const currentButtonRef = useRef<HTMLButtonElement>(null);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [suggestedChallenges, setSuggestedChallenges] = useState<
    SuggestedChallenge[]
  >([]);

  // Challenge draft state
  const [challengeDraft, setChallengeDraft] = useState<ChallengeDraft>({
    title: "",
    description: "",
    type: "behavioral",
    frequency: "daily",
    durationDays: 14,
    depositAmount: 50,
    depositRecipient: "platform",
    guarantors: [],
    guarantorsCount: 1,
    notificationSettings: {
      enabled: true,
      pushEnabled: true,
      emailEnabled: true,
    },
  });

  // Get auth token
  const getToken = useCallback(() => {
    return localStorage.getItem("accessToken");
  }, []);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      const token = getToken();
      if (!token) {
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/onboarding/session", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/");
            return;
          }
          throw new Error("Failed to initialize session");
        }

        const data = await response.json();
        setSessionId(data.session.id);
        setCurrentStep(data.session.current_step);
        setStepsCompleted(data.session.steps_completed || []);
        setTermsAccepted(data.termsAccepted);

        if (data.session.challenge_draft) {
          setChallengeDraft((prev) => ({
            ...prev,
            ...data.session.challenge_draft,
          }));
        }
        if (data.session.ai_messages) {
          setAiMessages(data.session.ai_messages);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [getToken, router]);

  // Scroll current step into view on mobile
  useEffect(() => {
    if (currentButtonRef.current) {
      currentButtonRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
      });
    }
  }, [currentStep]);

  // Handle share
  const handleShare = async () => {
    const url = `https://showup.com/onboarding/join?session=${sessionId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my challenge", url });
      } catch (err) {
        await copyToClipboard(url);
      }
    } else {
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        fallbackCopy(text);
      }
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Update session when step changes
  const updateSession = useCallback(
    async (
      updates: Partial<{
        currentStep: OnboardingStep;
        stepsCompleted: OnboardingStep[];
        challengeDraft: ChallengeDraft;
      }>,
    ) => {
      const token = getToken();
      if (!token || !sessionId) return;

      const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000);

      try {
        await fetch("/api/onboarding/session", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            ...updates,
            timeSpentSeconds: timeSpent,
          }),
        });
      } catch (err) {
        console.error("Failed to update session:", err);
      }
    },
    [getToken, sessionId, stepStartTime],
  );

  // Navigate to step
  const goToStep = useCallback(
    (step: OnboardingStep) => {
      const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
      const targetIndex = STEPS.findIndex((s) => s.key === step);

      // Only allow going to completed steps or the next step
      if (
        targetIndex <= currentIndex ||
        stepsCompleted.includes(STEPS[targetIndex - 1]?.key)
      ) {
        setCurrentStep(step);
        setStepStartTime(Date.now());
        updateSession({ currentStep: step });
      }
    },
    [currentStep, stepsCompleted, updateSession],
  );

  // Complete current step and move to next
  const completeStep = useCallback(
    (step: OnboardingStep) => {
      const newCompleted = [...stepsCompleted];
      if (!newCompleted.includes(step)) {
        newCompleted.push(step);
      }
      setStepsCompleted(newCompleted);

      const currentIndex = STEPS.findIndex((s) => s.key === step);
      if (currentIndex < STEPS.length - 1) {
        const nextStep = STEPS[currentIndex + 1].key;
        setCurrentStep(nextStep);
        setStepStartTime(Date.now());
        updateSession({ currentStep: nextStep, stepsCompleted: newCompleted });
      }
    },
    [stepsCompleted, updateSession, challengeDraft],
  );

  // Accept terms
  const handleAcceptTerms = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch("/api/onboarding/terms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, termsVersion: "1.0" }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept terms");
      }

      setTermsAccepted(true);
      completeStep("terms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept terms");
    }
  };

  // Send AI message
  const handleSendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const token = getToken();
    if (!token) return;

    const userMessage = aiInput.trim();
    setAiInput("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/onboarding/ai-chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          conversationId: conversationId || undefined,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      setConversationId(data.conversationId);
      setAiMessages((prev) => [
        ...prev,
        {
          id: `user_${Date.now()}`,
          role: "user",
          content: userMessage,
          timestamp: new Date(),
        },
        data.message,
      ]);

      if (data.suggestedChallenges) {
        setSuggestedChallenges(data.suggestedChallenges);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setAiLoading(false);
    }
  };

  // Select suggested challenge
  const handleSelectChallenge = async (challenge: SuggestedChallenge) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch("/api/onboarding/ai-chat", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          conversationId,
          selectedChallenge: challenge,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to select challenge");
      }

      setChallengeDraft((prev) => ({
        ...prev,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        frequency: challenge.suggestedFrequency,
        durationDays: challenge.suggestedDuration,
        depositAmount: challenge.suggestedDeposit,
        aiSuggested: true,
        aiConversationId: conversationId,
      }));

      completeStep("ai-chat");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to select challenge",
      );
    }
  };

  // Skip AI chat
  const handleSkipAiChat = () => {
    completeStep("ai-chat");
  };

  // Complete onboarding
  const handleCompleteOnboarding = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          challengeDraft,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete onboarding");
      }

      // Onboarding complete - payment step will be handled by StripeCheckout
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete onboarding",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Image
              src="/showup-icon.svg"
              alt="Loading"
              width={64}
              height={64}
              className="mx-auto opacity-50"
            />
          </div>
          <p className="text-muted-foreground">Loading your journey...</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/showup-icon.svg"
                alt="Showup"
                width={32}
                height={32}
              />
              <span className="text-lg font-serif font-bold">
                Your Challenge Journey
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {STEPS.length}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div
        className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 py-4 overflow-x-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between min-w-max">
            {STEPS.map(({ key, icon: Icon, label }, i) => (
              <div key={key} className="flex items-center">
                <button
                  ref={currentStep === key ? currentButtonRef : null}
                  onClick={() => goToStep(key)}
                  disabled={
                    i > currentStepIndex &&
                    !stepsCompleted.includes(STEPS[i - 1]?.key)
                  }
                  className={cn(
                    "flex flex-col items-center transition-all duration-300",
                    i <= currentStepIndex || stepsCompleted.includes(key)
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                      currentStep === key
                        ? "bg-primary text-primary-foreground scale-110"
                        : stepsCompleted.includes(key)
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground hidden sm:block">
                    {label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-8 sm:w-12 md:w-16 mx-1 transition-all duration-300",
                      stepsCompleted.includes(key)
                        ? "bg-green-500"
                        : "bg-muted",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-40 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
              <button onClick={() => setError("")} className="ml-2 underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Step 1: Terms and Services */}
          {currentStep === "terms" && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <Letter3DSwap
                  as="h1"
                  mainClassName="text-3xl md:text-4xl font-serif font-bold mb-4"
                  staggerDuration={0.02}
                >
                  Welcome to Showup
                </Letter3DSwap>
                <p className="text-lg text-muted-foreground">
                  Before we begin, please review our terms of service.
                </p>
              </div>

              <div className="neumorphic rounded-2xl p-6 mb-6">
                <h2 className="text-xl font-serif font-bold mb-4">
                  Terms of Service
                </h2>
                <div
                  className="h-64 overflow-y-auto text-sm text-muted-foreground space-y-4 pr-4"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <h3 className="font-semibold text-foreground">
                    1. Acceptance of Terms
                  </h3>
                  <p>
                    By creating an account and using Showup, you agree to these
                    Terms of Service. Showup is a platform designed to help you
                    build better habits through financial accountability and
                    social support.
                  </p>

                  <h3 className="font-semibold text-foreground">
                    2. How Showup Works
                  </h3>
                  <p>
                    When you create a challenge, you deposit funds that are held
                    securely until your challenge is complete. Your designated
                    guarantors will verify your progress. If you successfully
                    complete your challenge, your deposit is returned. If you
                    fail, your guarantors can vote on a &quot;Path of
                    Redemption&quot; to help you recover.
                  </p>

                  <h3 className="font-semibold text-foreground">
                    3. Deposits and Payments
                  </h3>
                  <p>
                    All deposits are processed securely through Stripe. Funds
                    are held in escrow until your challenge concludes. We do not
                    have access to your payment information.
                  </p>

                  <h3 className="font-semibold text-foreground">
                    4. Guarantors
                  </h3>
                  <p>
                    Guarantors are friends you designate to verify your
                    challenge completion. They must be real people with valid
                    email addresses. They will receive notifications about your
                    progress and may be asked to vote on outcomes.
                  </p>

                  <h3 className="font-semibold text-foreground">5. Privacy</h3>
                  <p>
                    We respect your privacy. Your challenge details are only
                    shared with your designated guarantors. We use anonymized
                    data to improve our service. See our full Privacy Policy for
                    details.
                  </p>

                  <h3 className="font-semibold text-foreground">6. Refunds</h3>
                  <p>
                    Deposits for completed challenges are returned within 7
                    business days. For failed challenges, the outcome depends on
                    guarantor voting. We do not offer refunds for challenges
                    abandoned mid-progress.
                  </p>

                  <h3 className="font-semibold text-foreground">
                    7. User Conduct
                  </h3>
                  <p>
                    You agree to use Showup responsibly and not create
                    challenges that are harmful, illegal, or impossible to
                    verify. We reserve the right to suspend accounts that
                    violate these terms.
                  </p>

                  <h3 className="font-semibold text-foreground">
                    8. Changes to Terms
                  </h3>
                  <p>
                    We may update these terms from time to time. We will notify
                    you of significant changes via email or in-app
                    notifications.
                  </p>

                  <p className="text-xs text-muted-foreground/70 pt-4">
                    Last updated: January 2026 | Version 1.0
                  </p>
                </div>
              </div>

              <button
                onClick={handleAcceptTerms}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-medium text-lg transition-all duration-300 hover:scale-[1.02]"
              >
                I Accept the Terms of Service
              </button>
            </div>
          )}

          {/* Step 2: AI Chat */}
          {currentStep === "ai-chat" && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <Letter3DSwap
                  as="h1"
                  mainClassName="text-3xl md:text-4xl font-serif font-bold mb-4"
                  staggerDuration={0.02}
                >
                  Discover Your Challenge
                </Letter3DSwap>
                <p className="text-muted-foreground">
                  Let&apos;s find the perfect challenge for you. Sometimes the
                  best challenges are mundane things we want to do consistently.
                </p>
              </div>

              {/* AI Chat Messages */}
              <div className="neumorphic rounded-2xl p-4 mb-4 h-80 overflow-y-auto">
                {aiMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Start a conversation to discover your ideal challenge.
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-2">
                      Try: &quot;I want to be more consistent with my skincare
                      routine&quot;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-3",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted",
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          {msg.suggestedChallenge && (
                            <div className="mt-3 p-3 rounded-xl bg-background/50 border border-border">
                              <p className="font-semibold text-sm">
                                {msg.suggestedChallenge.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {msg.suggestedChallenge.suggestedDuration} days
                                | ${msg.suggestedChallenge.suggestedDeposit}
                              </p>
                              <button
                                onClick={() =>
                                  handleSelectChallenge(msg.suggestedChallenge!)
                                }
                                className="mt-2 w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:scale-[1.02] transition-all"
                              >
                                Use This Challenge
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce-delay-0" />
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce-delay-1" />
                            <span
                              className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                              style={{ animationDelay: "0.6s" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendAiMessage()}
                  placeholder="What habit would you like to build?"
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
                  disabled={aiLoading}
                />
                <button
                  onClick={handleSendAiMessage}
                  disabled={!aiInput.trim() || aiLoading}
                  className="px-4 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 hover:scale-105 transition-all"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>

              {/* Suggested Challenges */}
              {suggestedChallenges.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">
                    Suggested Challenges:
                  </p>
                  <div className="space-y-2">
                    {suggestedChallenges.map((challenge, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectChallenge(challenge)}
                        className="w-full p-3 rounded-xl border border-border hover:border-primary text-left transition-all hover:scale-[1.01]"
                      >
                        <p className="font-medium">{challenge.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {challenge.suggestedDuration} days | $
                          {challenge.suggestedDeposit} | {challenge.type}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSkipAiChat}
                className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-all"
              >
                Skip - I know what I want
              </button>
            </div>
          )}

          {/* Step 3: Challenge Definition */}
          {currentStep === "challenge-definition" && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <Letter3DSwap
                  as="h1"
                  mainClassName="text-3xl md:text-4xl font-serif font-bold mb-4"
                  staggerDuration={0.02}
                >
                  Define Your Challenge
                </Letter3DSwap>
                <p className="text-muted-foreground">
                  What exactly will you commit to? Be specific - behavioral
                  challenges work best.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Challenge Title
                  </label>
                  <input
                    type="text"
                    value={challengeDraft.title}
                    onChange={(e) =>
                      setChallengeDraft((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Daily Skincare Ritual"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={challengeDraft.description}
                    onChange={(e) =>
                      setChallengeDraft((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe what you'll do and what success looks like..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Challenge Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CHALLENGE_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() =>
                          setChallengeDraft((prev) => ({
                            ...prev,
                            type: value,
                          }))
                        }
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          challengeDraft.type === value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <p className="font-medium text-sm">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-accent p-4 text-sm">
                  <p className="font-medium text-accent-foreground">Pro tip:</p>
                  <p className="text-muted-foreground mt-1">
                    The best challenges are specific and measurable. Instead of
                    &quot;exercise more,&quot; try &quot;complete a 20-minute
                    workout every morning.&quot;
                  </p>
                </div>

                <button
                  onClick={() => completeStep("challenge-definition")}
                  disabled={
                    !challengeDraft.title || !challengeDraft.description
                  }
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-medium text-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue{" "}
                  <ChevronRight className="inline-block ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Resolution Method */}
          {currentStep === "resolution" && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <Letter3DSwap
                  as="h1"
                  mainClassName="text-3xl md:text-4xl font-serif font-bold mb-4"
                  staggerDuration={0.02}
                >
                  How Will You Prove It?
                </Letter3DSwap>
                <p className="text-muted-foreground">
                  Your guarantors need to know what counts as success. How will
                  they verify you did it?
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Verification Method
                  </label>
                  <textarea
                    value={challengeDraft.resolutionMethod || ""}
                    onChange={(e) =>
                      setChallengeDraft((prev) => ({
                        ...prev,
                        resolutionMethod: e.target.value,
                      }))
                    }
                    placeholder="e.g., I'll send a photo of my completed skincare routine to my guarantor each evening"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                <div className="rounded-xl bg-muted p-4">
                  <p className="font-medium text-sm mb-2">
                    Verification Ideas:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>- Daily check-in photos or videos</li>
                    <li>- Screenshot of completed workout from an app</li>
                    <li>- Quick voice note confirming completion</li>
                    <li>- Shared calendar or habit tracker</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goToStep("challenge-definition")}
                    className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-all"
                  >
                    <ChevronLeft className="inline-block mr-2 h-5 w-5" />
                    Back
                  </button>
                  <button
                    onClick={() => completeStep("resolution")}
                    disabled={!challengeDraft.resolutionMethod}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    Continue
                    <ChevronRight className="inline-block ml-2 h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Deposit */}
          {currentStep === "deposit" && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <Letter3DSwap
                  as="h1"
                  mainClassName="text-3xl md:text-4xl font-serif font-bold mb-4"
                  staggerDuration={0.02}
                >
                  Put Skin in the Game
                </Letter3DSwap>
                <p className="text-muted-foreground">
                  Your deposit makes this real. Choose an amount that feels
                  meaningful - enough to motivate you, but not cause stress.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Deposit Amount
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {DEPOSIT_OPTIONS.map(({ amount, label, description }) => (
                      <button
                        key={amount}
                        onClick={() =>
                          setChallengeDraft((prev) => ({
                            ...prev,
                            depositAmount: amount,
                          }))
                        }
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all",
                          challengeDraft.depositAmount === amount
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <p className="text-2xl font-bold">{label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {description}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <input
                      type="text"
                      value={
                        challengeDraft.depositAmount
                          ? challengeDraft.depositAmount.toString()
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, ""); // remove leading zeros
                        setChallengeDraft((prev) => ({
                          ...prev,
                          depositAmount: val ? parseInt(val) : 0,
                        }));
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all text-center text-2xl font-bold"
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Or enter a custom amount
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-accent p-4 text-sm">
                  <p className="text-accent-foreground">
                    <strong>Remember:</strong> Your deposit is returned when you
                    successfully complete your challenge. Think of it as a
                    commitment to yourself, not a cost.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goToStep("resolution")}
                    className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-all"
                  >
                    <ChevronLeft className="inline-block mr-2 h-5 w-5" />
                    Back
                  </button>
                  <button
                    onClick={() => completeStep("deposit")}
                    disabled={
                      !challengeDraft.depositAmount ||
                      challengeDraft.depositAmount < 1
                    }
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    Continue
                    <ChevronRight className="inline-block ml-2 h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Notifications */}
          {currentStep === "notifications" && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <Letter3DSwap
                  as="h1"
                  mainClassName="text-3xl md:text-4xl font-serif font-bold mb-4"
                  staggerDuration={0.02}
                >
                  Stay on Track
                </Letter3DSwap>
                <p className="text-muted-foreground">
                  Notifications help you build consistency. This challenge will
                  become part of your daily life.
                </p>
              </div>

              <div className="space-y-6">
                <div className="neumorphic rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when it&apos;s time to do your challenge
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setChallengeDraft((prev) => ({
                          ...prev,
                          notificationSettings: {
                            ...prev.notificationSettings,
                            enabled: !prev.notificationSettings?.enabled,
                          },
                        }))
                      }
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        challengeDraft.notificationSettings?.enabled
                          ? "bg-primary"
                          : "bg-muted",
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                          challengeDraft.notificationSettings?.enabled
                            ? "left-7"
                            : "left-1",
                        )}
                      />
                    </button>
                  </div>
                </div>

                {challengeDraft.notificationSettings?.enabled && (
                  <div className="space-y-4">
                    <div className="neumorphic rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">
                            Instant reminders on your device
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setChallengeDraft((prev) => ({
                              ...prev,
                              notificationSettings: {
                                enabled:
                                  prev.notificationSettings?.enabled ?? true,
                                ...prev.notificationSettings,
                                pushEnabled:
                                  !prev.notificationSettings?.pushEnabled,
                              },
                            }))
                          }
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            challengeDraft.notificationSettings?.pushEnabled
                              ? "bg-primary"
                              : "bg-muted",
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                              challengeDraft.notificationSettings?.pushEnabled
                                ? "left-7"
                                : "left-1",
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="neumorphic rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Reminders</p>
                          <p className="text-sm text-muted-foreground">
                            Daily digest to your inbox
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setChallengeDraft((prev) => ({
                              ...prev,
                              notificationSettings: {
                                enabled:
                                  prev.notificationSettings?.enabled ?? true,
                                ...prev.notificationSettings,
                                emailEnabled:
                                  !prev.notificationSettings?.emailEnabled,
                              },
                            }))
                          }
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            challengeDraft.notificationSettings?.emailEnabled
                              ? "bg-primary"
                              : "bg-muted",
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                              challengeDraft.notificationSettings?.emailEnabled
                                ? "left-7"
                                : "left-1",
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Reminder Time
                      </label>
                      <select
                        value={
                          challengeDraft.notificationSettings?.reminderTime ||
                          "09:00"
                        }
                        onChange={(e) =>
                          setChallengeDraft((prev) => ({
                            ...prev,
                            notificationSettings: {
                              enabled:
                                prev.notificationSettings?.enabled ?? true,
                              ...prev.notificationSettings,
                              reminderTime: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
                      >
                        <option value="06:00">6:00 AM</option>
                        <option value="07:00">7:00 AM</option>
                        <option value="08:00">8:00 AM</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                        <option value="18:00">6:00 PM</option>
                        <option value="19:00">7:00 PM</option>
                        <option value="20:00">8:00 PM</option>
                        <option value="21:00">9:00 PM</option>
                        <option value="22:00">10:00 PM</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => goToStep("deposit")}
                    className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-all"
                  >
                    <ChevronLeft className="inline-block mr-2 h-5 w-5" />
                    Back
                  </button>
                  <button
                    onClick={() => completeStep("notifications")}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:scale-[1.02]"
                  >
                    Continue
                    <ChevronRight className="inline-block ml-2 h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Activity Rate */}
          {currentStep === "activity-rate" && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <Letter3DSwap
                  as="h1"
                  mainClassName="text-3xl md:text-4xl font-serif font-bold mb-4"
                  staggerDuration={0.02}
                >
                  Set Your Schedule
                </Letter3DSwap>
                <p className="text-muted-foreground">
                  How often will you do this, and for how long? Start achievable
                  - you can always create bigger challenges later.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FREQUENCY_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() =>
                          setChallengeDraft((prev) => ({
                            ...prev,
                            frequency: value,
                          }))
                        }
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all",
                          challengeDraft.frequency === value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {challengeDraft.frequency === "specific-days" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Days
                    </label>
                    <div className="flex gap-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const current =
                              challengeDraft.frequencyDetails?.daysOfWeek || [];
                            const updated = current.includes(i)
                              ? current.filter((d) => d !== i)
                              : [...current, i];
                            setChallengeDraft((prev) => ({
                              ...prev,
                              frequencyDetails: {
                                ...prev.frequencyDetails,
                                daysOfWeek: updated,
                              },
                            }));
                          }}
                          className={cn(
                            "w-10 h-10 rounded-full font-medium transition-all",
                            challengeDraft.frequencyDetails?.daysOfWeek?.includes(
                              i,
                            )
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80",
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-3">
                    Duration
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {DURATION_OPTIONS.map(({ days, label, description }) => (
                      <button
                        key={days}
                        onClick={() =>
                          setChallengeDraft((prev) => ({
                            ...prev,
                            durationDays: days,
                          }))
                        }
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all",
                          challengeDraft.durationDays === days
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <p className="font-bold">{label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-accent p-4 text-sm">
                  <p className="text-accent-foreground">
                    <strong>Start small:</strong> A 7-day challenge you complete
                    builds more momentum than a 30-day challenge you abandon.
                    You can always level up after you succeed.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goToStep("notifications")}
                    className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-all"
                  >
                    <ChevronLeft className="inline-block mr-2 h-5 w-5" />
                    Back
                  </button>
                  <button
                    onClick={() => completeStep("activity-rate")}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:scale-[1.02]"
                  >
                    Continue
                    <ChevronRight className="inline-block ml-2 h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Sharing */}
          {currentStep === "sharing" && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <Letter3DSwap
                  as="h1"
                  mainClassName="text-3xl md:text-4xl font-serif font-bold mb-4"
                  staggerDuration={0.02}
                >
                  Add Your Guarantors
                </Letter3DSwap>
                <p className="text-muted-foreground">
                  These friends will hold you accountable. They&apos;ll verify
                  your progress and can vote on your Path of Redemption if
                  needed.
                </p>
              </div>

              <div className="space-y-6">
                {/* Challenge Summary */}
                <div className="neumorphic rounded-xl p-4">
                  <h3 className="font-medium mb-3">Your Challenge</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Challenge</span>
                      <span className="font-medium">
                        {challengeDraft.title}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">
                        {challengeDraft.durationDays} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency</span>
                      <span className="font-medium capitalize">
                        {challengeDraft.frequency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposit</span>
                      <span className="font-medium">
                        ${challengeDraft.depositAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Number of Guarantors */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of Guarantors Desired
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={challengeDraft.guarantorsCount || 1}
                    onChange={(e) =>
                      setChallengeDraft((prev) => ({
                        ...prev,
                        guarantorsCount: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Share Link */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Share Challenge Link
                  </label>
                  <button
                    onClick={handleShare}
                    className="w-full py-3 rounded-xl border border-border hover:bg-muted transition-all flex items-center justify-center"
                  >
                    {copied ? (
                      <>
                        <Layers2 className="h-5 w-5 mr-2" />
                        <span> Copied! </span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-5 w-5 mr-2" />
                        <span> Share Link </span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-xl bg-accent p-4 text-sm">
                  <p className="text-accent-foreground">
                    <strong>Tip:</strong> Choose an odd number of guarantors (1,
                    3, 5) to avoid tie votes. Pick people who genuinely want to
                    see you succeed.
                  </p>
                </div>

                {showingPay ? (
                  <div className="mt-4">
                    <StripeCheckout
                      amount={challengeDraft.depositAmount || 50}
                      challengeId={`challenge_${Date.now()}_${Math.random().toString(36).substring(7)}`}
                      metadata={{
                        challengeTitle: challengeDraft.title || "My Challenge",
                        challengeDuration: (
                          challengeDraft.durationDays || 14
                        ).toString(),
                        metadataUri: "",
                        guarantorsCount: (
                          challengeDraft.guarantorsCount || 1
                        ).toString(),
                      }}
                      onError={(error) =>
                        setError(
                          typeof error === "string"
                            ? error
                            : error.message || "Payment error",
                        )
                      }
                    />
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => goToStep("activity-rate")}
                      className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-all"
                    >
                      <ChevronLeft className="inline-block mr-2 h-5 w-5" />
                      Back
                    </button>
                    <button
                      onClick={() => setShowingPay(true)}
                      disabled={!challengeDraft.guarantorsCount}
                      className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                      Complete & Deposit
                      <ArrowRight className="inline-block ml-2 h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
