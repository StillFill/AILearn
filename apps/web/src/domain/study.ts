export interface LearningSession {
  id: string;
  ownerUserId: string;
  subject: string;
  topic: string;
  declaredDifficulty: string;
  goal: string;
  understandingScore: number;
  understandingSummary: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  conversationId?: string | null;
}

export interface LearningSignal {
  id: string;
  ownerUserId: string;
  sessionId: string | null;
  subject: string;
  topic: string | null;
  painPoint: string;
  confidence: number;
  evidence: string | null;
  planHint: string | null;
  createdAt: string;
}

export interface AdaptivePlan {
  focus: string[];
  nextSteps: string[];
}
