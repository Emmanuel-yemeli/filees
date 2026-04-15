// ============================================================
// ENUMS
// ============================================================

export enum ComplaintStatus {
  OPEN         = 'OPEN',
  IN_PROGRESS  = 'IN_PROGRESS',
  PENDING_USER = 'PENDING_USER',
  RESOLVED     = 'RESOLVED',
  CLOSED       = 'CLOSED',
  ESCALATED    = 'ESCALATED'
}

export enum ComplaintPriority {
  LOW      = 'LOW',
  MEDIUM   = 'MEDIUM',
  HIGH     = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ComplaintCategory {
  PAYMENT_ISSUE         = 'PAYMENT_ISSUE',
  QUALITY_DISPUTE       = 'QUALITY_DISPUTE',
  COMMUNICATION_PROBLEM = 'COMMUNICATION_PROBLEM',
  HARASSMENT            = 'HARASSMENT',
  SCAM                  = 'SCAM',
  TECHNICAL_ISSUE       = 'TECHNICAL_ISSUE',
  OTHER                 = 'OTHER'
}

export enum ResolutionType {
  REFUND             = 'REFUND',
  WARNING            = 'WARNING',
  ACCOUNT_SUSPENSION = 'ACCOUNT_SUSPENSION',
  NO_ACTION          = 'NO_ACTION',
  MEDIATION          = 'MEDIATION'
}

export enum MessageType {
  TEXT         = 'TEXT',
  NOTE_INTERNE = 'NOTE_INTERNE',
  RESOLUTION   = 'RESOLUTION',
  AUTO_RESPONSE = 'AUTO_RESPONSE'
}

export enum SenderType {
  USER    = 'USER',
  SUPPORT = 'SUPPORT',
  SYSTEM  = 'SYSTEM'
}

/**
 * Type de conversation dans une réclamation.
 * COMPLAINANT = fil plaignant ↔ support
 * REPORTED    = fil partie mise en cause ↔ support
 */
export enum ConversationType {
  COMPLAINANT = 'COMPLAINANT',
  REPORTED    = 'REPORTED'
}

// ============================================================
// INTERFACES PRINCIPALES
// ============================================================

export interface Complaint {
  id: string;
  ticketNumber: string;
  reporterId: string;
  reportedUserId?: string;
  projectId?: string;
  assignedToId?: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  subject: string;
  description: string;
  attachments?: string[];
  resolution?: string;
  resolutionType?: ResolutionType;
  satisfactionRating?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  firstResponseAt?: Date;
}

export interface SupportMessage {
  id: string;
  complaintId: string;
  senderId: string;
  senderType: SenderType;
  messageType: MessageType;
  conversationType: ConversationType;
  content: string;
  attachments?: string[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// ============================================================
// DTOs — REQUÊTES
// ============================================================

export interface CreateComplaintRequest {
  category: ComplaintCategory;
  priority?: ComplaintPriority;
  subject: string;
  description: string;
  reportedUserEmail?: string;
  projectId?: string;
  attachments?: string[];
}

export interface CreateMessageRequest {
  complaintId: string;
  content: string;
  messageType?: MessageType;
  conversationType?: ConversationType;
  attachments?: string[];
}

export interface ResolveComplaintRequest {
  resolution: string;
  resolutionType: ResolutionType;
}

export interface InvolveReportedRequest {
  invitationMessage: string;
}

// ============================================================
// LABELS — AFFICHAGE
// ============================================================

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  [ComplaintStatus.OPEN]:         'Ouverte',
  [ComplaintStatus.IN_PROGRESS]:  'En cours',
  [ComplaintStatus.PENDING_USER]: 'En attente',
  [ComplaintStatus.RESOLVED]:     'Résolue',
  [ComplaintStatus.CLOSED]:       'Clôturée',
  [ComplaintStatus.ESCALATED]:    'Escaladée'
};

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  [ComplaintStatus.OPEN]:         '#1976d2',
  [ComplaintStatus.IN_PROGRESS]:  '#f57c00',
  [ComplaintStatus.PENDING_USER]: '#7b1fa2',
  [ComplaintStatus.RESOLVED]:     '#388e3c',
  [ComplaintStatus.CLOSED]:       '#616161',
  [ComplaintStatus.ESCALATED]:    '#c62828'
};

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  [ComplaintPriority.LOW]:      'Faible',
  [ComplaintPriority.MEDIUM]:   'Moyenne',
  [ComplaintPriority.HIGH]:     'Haute',
  [ComplaintPriority.CRITICAL]: 'Critique'
};

export const PRIORITY_COLORS: Record<ComplaintPriority, string> = {
  [ComplaintPriority.LOW]:      '#43a047',
  [ComplaintPriority.MEDIUM]:   '#fb8c00',
  [ComplaintPriority.HIGH]:     '#e53935',
  [ComplaintPriority.CRITICAL]: '#b71c1c'
};

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  [ComplaintCategory.PAYMENT_ISSUE]:         'Problème de paiement',
  [ComplaintCategory.QUALITY_DISPUTE]:       'Litige qualité',
  [ComplaintCategory.COMMUNICATION_PROBLEM]: 'Problème de communication',
  [ComplaintCategory.HARASSMENT]:            'Harcèlement',
  [ComplaintCategory.SCAM]:                  'Arnaque',
  [ComplaintCategory.TECHNICAL_ISSUE]:       'Problème technique',
  [ComplaintCategory.OTHER]:                 'Autre'
};

export const CONVERSATION_LABELS: Record<ConversationType, string> = {
  [ConversationType.COMPLAINANT]: 'Ma conversation',
  [ConversationType.REPORTED]:    'Partie mise en cause'
};