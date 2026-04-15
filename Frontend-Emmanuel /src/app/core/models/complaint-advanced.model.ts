// ── SLA ──────────────────────────────────────────────────────────────────────

export interface SlaRule {
  id: string;
  priority: string;
  maxFirstResponseHours: number;
  maxResolutionHours: number;
  autoEscalateOnBreach: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SlaTracking {
  id: string;
  complaintId: string;
  firstResponseDeadline: string;
  resolutionDeadline: string;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  firstResponseMet: boolean;
  escalatedAt: string | null;
  createdAt: string;
}

export interface CreateSlaRuleRequest {
  priority: string;
  maxFirstResponseHours: number;
  maxResolutionHours: number;
  autoEscalateOnBreach: boolean;
}

// ── Mediation ─────────────────────────────────────────────────────────────────

export type MediationStatus = 'OPEN' | 'EVIDENCE_PHASE' | 'DELIBERATION' | 'CLOSED';

export interface MediationEvidence {
  id: string;
  sessionId: string;
  submittedByUserId: string;
  partyType: 'COMPLAINANT' | 'REPORTED';
  description: string;
  fileUrls: string[];
  submittedAt: string;
}

export interface MediationSession {
  id: string;
  complaintId: string;
  status: MediationStatus;
  openedByAdminId: string;
  adminNote: string | null;
  evidenceDeadline: string | null;
  outcome: string | null;
  decidedByAdminId: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  evidences: MediationEvidence[];
}

export interface OpenMediationRequest {
  adminNote?: string;
  evidenceDeadlineHours?: number;
}

export interface SubmitEvidenceRequest {
  description: string;
  fileUrls?: string[];
}

export interface MediationDecisionRequest {
  outcome: string;
  resolutionType: string;
}

// ── Risk & Sanctions ──────────────────────────────────────────────────────────

export interface UserRiskProfile {
  id: string;
  userId: string;
  riskScore: number;           // 0 – 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  totalComplaintsReceived: number;
  resolvedAgainst: number;
  scamCount: number;
  harassmentCount: number;
  lastComputedAt: string;
}

export type SanctionType = 'WARNING' | 'TEMPORARY_SUSPENSION' | 'PERMANENT_SUSPENSION';

export interface UserSanction {
  id: string;
  userId: string;
  type: SanctionType;
  reason: string;
  appliedByAdminId: string | null;
  appliedBySystem: boolean;
  liftedAt: string | null;
  liftedByAdminId: string | null;
  expiresAt: string | null;
  active: boolean;
  appliedAt: string;
}

export interface ApplySanctionRequest {
  type: SanctionType;
  reason: string;
}

// ── Response Templates ────────────────────────────────────────────────────────

export interface ResponseTemplate {
  id: string;
  title: string;
  content: string;
  category: string | null;
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  title: string;
  content: string;
  category?: string;
}

// ── NPS ──────────────────────────────────────────────────────────────────────

export interface NpsSurvey {
  id: string;
  complaintId: string;
  respondentId: string;
  score: number;  // 0 – 10
  comment: string | null;
  sentAt: string;
  respondedAt: string | null;
}

export interface NpsStats {
  totalSent: number;
  totalResponded: number;
  responseRate: number;
  npsScore: number;             // -100 to 100
  promoters: number;
  passives: number;
  detractors: number;
  averageScore: number;
  scoreDistribution: Record<string, number>;
}

export interface NpsResponseRequest {
  score: number;
  comment?: string;
}

// ── Reopen ────────────────────────────────────────────────────────────────────

export interface ReopenRequest {
  reason: string;
}
