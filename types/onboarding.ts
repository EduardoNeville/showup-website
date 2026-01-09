export type OnboardingStep = 
  | 'terms'
  | 'ai-chat'
  | 'challenge-definition'
  | 'resolution'
  | 'deposit'
  | 'notifications'
  | 'activity-rate'
  | 'sharing';

export interface OnboardingSession {
  id: string;
  user_id: string;
  started_at: Date;
  completed_at: Date | null;
  current_step: OnboardingStep;
  steps_completed: OnboardingStep[];
  challenge_draft: ChallengeDraft;
  ai_messages: AIMessage[];
  abandoned_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChallengeDraft {
  title?: string;
  description?: string;
  type?: ChallengeType;
  resolutionMethod?: string;
  depositAmount?: number;
  depositRecipient?: 'platform' | 'friend';
  linkedFriendEmail?: string;
  frequency?: FrequencyType;
  frequencyDetails?: FrequencyDetails;
  durationDays?: number;
   notificationSettings?: NotificationSettings;
   guarantors?: string[];
   guarantorsCount?: number;
   aiSuggested?: boolean;
  aiConversationId?: string;
}

export type ChallengeType = 
  | 'behavioral'
  | 'habit'
  | 'milestone'
  | 'consistency'
  | 'wellness'
  | 'learning'
  | 'fitness'
  | 'productivity'
  | 'custom';

export type FrequencyType = 
  | 'daily'
  | 'weekly'
  | 'specific-days'
  | 'custom';

export interface FrequencyDetails {
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  timesPerWeek?: number;
  timesPerDay?: number;
  specificTimes?: string[]; // ISO time strings
  customSchedule?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime?: string; // ISO time string
  reminderDaysBefore?: number;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestedChallenge?: SuggestedChallenge;
}

export interface SuggestedChallenge {
  title: string;
  description: string;
  type: ChallengeType;
  suggestedFrequency: FrequencyType;
  suggestedDuration: number;
  suggestedDeposit: number;
  reasoning: string;
}

export interface OnboardingAnalyticsEvent {
  id: string;
  session_id: string;
  user_id: string;
  event_type: AnalyticsEventType;
  event_data: Record<string, unknown>;
  step_name: OnboardingStep | null;
  time_spent_seconds: number | null;
  created_at: Date;
}

export type AnalyticsEventType =
  | 'session_started'
  | 'step_started'
  | 'step_completed'
  | 'step_skipped'
  | 'step_returned'
  | 'ai_message_sent'
  | 'ai_message_received'
  | 'challenge_selected'
  | 'deposit_amount_changed'
  | 'guarantor_added'
  | 'guarantor_removed'
  | 'terms_accepted'
  | 'session_completed'
  | 'session_abandoned';

export interface AIConversation {
  id: string;
  user_id: string;
  onboarding_session_id: string | null;
  messages: AIMessage[];
  suggested_challenges: SuggestedChallenge[];
  selected_challenge: SuggestedChallenge | null;
  model_used: string | null;
  total_tokens_used: number;
  created_at: Date;
  updated_at: Date;
}

// Challenge creation request that combines onboarding with existing flow
export interface CreateChallengeFromOnboardingRequest {
  sessionId: string;
  challengeDraft: ChallengeDraft;
  paymentMethod: 'stripe' | 'crypto';
}

// Terms and Services
export interface TermsAcceptance {
  termsVersion: string;
  acceptedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}
