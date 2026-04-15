// ── Enums ─────────────────────────────────────────────────────────────────────

export enum OrganizationType {
  AGENCY         = 'AGENCY',
  STARTUP        = 'STARTUP',
  SME            = 'SME',
  ENTERPRISE     = 'ENTERPRISE',
  ASSOCIATION    = 'ASSOCIATION',
  FREELANCE_COOP = 'FREELANCE_COOP'
}

export enum OrganizationStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  AWAITING_INFO        = 'AWAITING_INFO',
  ACTIVE               = 'ACTIVE',
  SUSPENDED            = 'SUSPENDED',
  DISSOLVED            = 'DISSOLVED',
  REJECTED             = 'REJECTED'
}

export enum OrganizationSize {
  SOLO   = 'SOLO',
  SMALL  = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE  = 'LARGE'
}

export enum OrganizationVisibility {
  PUBLIC  = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

export enum MemberRole {
  OWNER   = 'OWNER',
  MANAGER = 'MANAGER',
  MEMBER  = 'MEMBER'
}

export enum MemberStatus {
  ACTIVE  = 'ACTIVE',
  REMOVED = 'REMOVED',
  LEFT    = 'LEFT'
}

export enum InvitationStatus {
  PENDING   = 'PENDING',
  ACCEPTED  = 'ACCEPTED',
  DECLINED  = 'DECLINED',
  EXPIRED   = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

// ── Response types ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  type: OrganizationType;
  specialties: string[];
  location: string | null;
  siret: string | null;
  size: OrganizationSize;
  status: OrganizationStatus;
  visibility: OrganizationVisibility;
  ownerId: string;
  averageRating: number;
  completedProjectsCount: number;
  reviewCount: number;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  dissolvedAt: string | null;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  type: OrganizationType;
  specialties: string[];
  location: string | null;
  size: OrganizationSize;
  status: OrganizationStatus;
  visibility: OrganizationVisibility;
  averageRating: number;
  reviewCount: number;
  completedProjectsCount: number;
  memberCount: number;
}

export interface OrgMember {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  displayOnProfile: boolean;
  joinedAt: string;
  leftAt: string | null;
}

export interface OrgInvitation {
  id: string;
  organizationId: string;
  organizationName: string | null;
  organizationLogoUrl: string | null;
  invitedUserId: string | null;
  invitedEmail: string | null;
  invitedByUserId: string;
  proposedRole: MemberRole;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
}

export interface OrgReview {
  id: string;
  organizationId: string;
  clientId: string;
  projectId: string | null;
  qualityRating: number;
  communicationRating: number;
  deadlineRating: number;
  valueRating: number;
  averageRating: number;
  comment: string | null;
  ownerReply: string | null;
  replyAt: string | null;
  reported: boolean;
  createdAt: string;
}

export interface OrgAuditLog {
  id: string;
  organizationId: string;
  performedByUserId: string;
  action: string;
  details: string | null;
  performedAt: string;
}

export interface OrgDashboardStats {
  total: number;
  countByStatus: Record<string, number>;
  countByType: Record<string, number>;
  newByMonth: Record<string, number>;
  pendingVerification: number;
  verificationRate: number;
  top10ByProjects: OrganizationSummary[];
  top10ByRating: OrganizationSummary[];
}

// ── Page wrapper (Spring Data) ─────────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Request types ──────────────────────────────────────────────────────────────

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  type: OrganizationType;
  specialties?: string[];
  location?: string;
  siret?: string;
  size?: OrganizationSize;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  specialties?: string[];
  location?: string;
  size?: OrganizationSize;
}

export interface InviteMemberRequest {
  invitedUserId?: string;
  invitedEmail?: string;
  proposedRole?: MemberRole;
}

export interface CreateReviewRequest {
  projectId?: string;
  qualityRating: number;
  communicationRating: number;
  deadlineRating: number;
  valueRating: number;
  comment?: string;
}

export interface AdminVerifyRequest {
  decision: 'APPROVE' | 'REJECT' | 'AWAITING_INFO';
  note?: string;
}

export interface AdminSuspendRequest {
  reason: string;
}

// ── Advanced feature types ──────────────────────────────────────────────────

export enum ApplicationStatus {
  PENDING   = 'PENDING',
  ACCEPTED  = 'ACCEPTED',
  REJECTED  = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum RfqStatus {
  PENDING   = 'PENDING',
  RESPONDED = 'RESPONDED',
  CLOSED    = 'CLOSED'
}

export enum TrustBadge {
  VERIFIED       = 'VERIFIED',
  TOP_RATED      = 'TOP_RATED',
  EXPERIENCED    = 'EXPERIENCED',
  FAST_RESPONDER = 'FAST_RESPONDER',
  PREMIUM        = 'PREMIUM'
}

export interface OrgPortfolioItem {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  projectUrl: string | null;
  clientName: string | null;
  tags: string[];
  completedAt: string | null;
  createdAt: string;
}

export interface OrgApplication {
  id: string;
  organizationId: string;
  applicantId: string;
  message: string;
  cvUrl: string | null;
  status: ApplicationStatus;
  rejectionReason: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface OrgRfq {
  id: string;
  organizationId: string;
  requesterId: string;
  title: string;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  deadline: string | null;
  skillsNeeded: string[];
  status: RfqStatus;
  responseMessage: string | null;
  respondedById: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface OrgBadgeInfo {
  organizationId: string;
  trustLevel: number;
  badges: TrustBadge[];
}

export interface CreatePortfolioItemRequest {
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  clientName?: string;
  tags?: string[];
  completedAt?: string;
}

export interface CreateApplicationRequest {
  message: string;
  cvUrl?: string;
}

export interface RespondApplicationRequest {
  status: 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
}

export interface CreateRfqRequest {
  title: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: string;
  skillsNeeded?: string[];
}

export interface RfqResponseRequest {
  responseMessage: string;
}

export interface MatchingRequest {
  requiredSpecialties?: string[];
  preferredType?: OrganizationType;
  minRating?: number;
  minProjects?: number;
}
