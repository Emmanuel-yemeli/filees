import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Organization, OrganizationSummary, OrgMember, OrgInvitation,
  OrgReview, OrgAuditLog, OrgDashboardStats, Page,
  CreateOrganizationRequest, UpdateOrganizationRequest,
  InviteMemberRequest, CreateReviewRequest,
  AdminVerifyRequest, AdminSuspendRequest,
  OrganizationSize, OrganizationType, OrganizationVisibility
} from '../models/organization.model';
import {
  OrgPortfolioItem, OrgApplication, OrgRfq, OrgBadgeInfo,
  CreatePortfolioItemRequest, CreateApplicationRequest,
  RespondApplicationRequest, CreateRfqRequest, RfqResponseRequest,
  MatchingRequest
} from '../models/organization.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private http = inject(HttpClient);

  // Tout passe par le Gateway (8765) → organization-service (9095)
  private readonly BASE    = `${environment.organizationsApiUrl}/organizations`;
  private readonly ADMIN   = `${environment.organizationsApiUrl}/admin/organizations`;
  private readonly INV     = `${environment.organizationsApiUrl}/invitations`;

  // ── Public ────────────────────────────────────────────────────────────────

  search(query?: string, type?: OrganizationType, size?: OrganizationSize, page = 0, pageSize = 12): Observable<Page<OrganizationSummary>> {
    let params = new HttpParams().set('page', page).set('size', pageSize);
    if (query) params = params.set('query', query);
    if (type)  params = params.set('type', type);
    if (size)  params = params.set('size', size);
    return this.http.get<Page<OrganizationSummary>>(`${this.BASE}/search`, { params });
  }

  getById(id: string): Observable<Organization> {
    return this.http.get<Organization>(`${this.BASE}/${id}`);
  }

  getReviews(orgId: string, page = 0, pageSize = 10): Observable<Page<OrgReview>> {
    const params = new HttpParams().set('page', page).set('size', pageSize);
    return this.http.get<Page<OrgReview>>(`${this.BASE}/${orgId}/reviews`, { params });
  }

  // ── User-authenticated ────────────────────────────────────────────────────

  create(req: CreateOrganizationRequest): Observable<Organization> {
    return this.http.post<Organization>(this.BASE, req);
  }

  update(id: string, req: UpdateOrganizationRequest): Observable<Organization> {
    return this.http.put<Organization>(`${this.BASE}/${id}`, req);
  }

  setVisibility(id: string, visibility: OrganizationVisibility): Observable<Organization> {
    return this.http.patch<Organization>(`${this.BASE}/${id}/visibility`, null, {
      params: new HttpParams().set('visibility', visibility)
    });
  }

  // Backend: POST /{id}/dissolve (soft-delete, conserve données)
  dissolve(id: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/${id}/dissolve`, null);
  }

  getMyOrganizations(): Observable<OrganizationSummary[]> {
    return this.http.get<OrganizationSummary[]>(`${this.BASE}/my`);
  }

  // ── Members ───────────────────────────────────────────────────────────────

  getMembers(orgId: string): Observable<OrgMember[]> {
    return this.http.get<OrgMember[]>(`${this.BASE}/${orgId}/members`);
  }

  // Promotion via PATCH /{memberId}/role?role=MANAGER (backend MemberController)
  promoteToManager(orgId: string, memberId: string): Observable<OrgMember> {
    return this.http.patch<OrgMember>(`${this.BASE}/${orgId}/members/${memberId}/role`, null, {
      params: new HttpParams().set('role', 'MANAGER')
    });
  }

  removeMember(orgId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${orgId}/members/${memberId}`);
  }

  // Backend: POST /leave (non DELETE)
  leaveOrganization(orgId: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/${orgId}/members/leave`, null);
  }

  // Backend: POST /{orgId}/transfer-ownership avec body { newOwnerId }
  transferOwnership(orgId: string, newOwnerId: string, confirmationName: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/${orgId}/transfer-ownership`, { newOwnerId });
  }

  toggleProfileDisplay(orgId: string, display: boolean): Observable<OrgMember> {
    return this.http.patch<OrgMember>(`${this.BASE}/${orgId}/members/profile-display`, null, {
      params: new HttpParams().set('display', display)
    });
  }

  // ── Invitations ───────────────────────────────────────────────────────────

  invite(orgId: string, req: InviteMemberRequest): Observable<OrgInvitation> {
    return this.http.post<OrgInvitation>(`${this.BASE}/${orgId}/invitations`, req);
  }

  cancelInvitation(orgId: string, invitationId: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${orgId}/invitations/${invitationId}`);
  }

  getPendingInvitationsForOrg(orgId: string): Observable<OrgInvitation[]> {
    return this.http.get<OrgInvitation[]>(`${this.BASE}/${orgId}/invitations`);
  }

  respondByToken(token: string, accept: boolean): Observable<OrgInvitation> {
    return this.http.post<OrgInvitation>(`${this.INV}/token/${token}/respond`, null, {
      params: new HttpParams().set('accepted', accept)
    });
  }

  getMyPendingInvitations(): Observable<OrgInvitation[]> {
    return this.http.get<OrgInvitation[]>(`${this.INV}/my`);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  submitReview(orgId: string, req: CreateReviewRequest): Observable<OrgReview> {
    return this.http.post<OrgReview>(`${this.BASE}/${orgId}/reviews`, req);
  }

  replyToReview(orgId: string, reviewId: string, reply: string): Observable<OrgReview> {
    return this.http.post<OrgReview>(`${this.BASE}/${orgId}/reviews/${reviewId}/reply`, { reply });
  }

  reportReview(orgId: string, reviewId: string): Observable<OrgReview> {
    return this.http.post<OrgReview>(`${this.BASE}/${orgId}/reviews/${reviewId}/report`, {});
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  getPendingVerification(): Observable<Organization[]> {
    // Backend retourne Page<OrganizationResponse> → on extrait .content
    return this.http.get<Page<Organization>>(`${this.ADMIN}/pending`).pipe(
      map(page => page.content)
    );
  }

  verifyOrg(id: string, req: AdminVerifyRequest): Observable<Organization> {
    return this.http.post<Organization>(`${this.ADMIN}/${id}/verify`, req);
  }

  suspendOrg(id: string, req: AdminSuspendRequest): Observable<Organization> {
    return this.http.post<Organization>(`${this.ADMIN}/${id}/suspend`, req);
  }

  reactivateOrg(id: string): Observable<Organization> {
    return this.http.post<Organization>(`${this.ADMIN}/${id}/reactivate`, {});
  }

  hardDeleteOrg(id: string): Observable<void> {
    return this.http.delete<void>(`${this.ADMIN}/${id}`);
  }

  forceDissolveOrg(id: string): Observable<void> {
    return this.http.delete<void>(`${this.ADMIN}/${id}/force-dissolve`);
  }

  getAuditLog(orgId: string, page = 0): Observable<Page<OrgAuditLog>> {
    const params = new HttpParams().set('page', page).set('size', 20);
    return this.http.get<Page<OrgAuditLog>>(`${this.ADMIN}/${orgId}/audit`, { params });
  }

  getDashboardStats(): Observable<OrgDashboardStats> {
    return this.http.get<OrgDashboardStats>(`${this.ADMIN}/stats`);
  }

  // ── Portfolio ─────────────────────────────────────────────────────────────

  getPortfolio(orgId: string): Observable<OrgPortfolioItem[]> {
    return this.http.get<OrgPortfolioItem[]>(`${this.BASE}/${orgId}/portfolio`);
  }

  createPortfolioItem(orgId: string, req: CreatePortfolioItemRequest): Observable<OrgPortfolioItem> {
    return this.http.post<OrgPortfolioItem>(`${this.BASE}/${orgId}/portfolio`, req);
  }

  updatePortfolioItem(orgId: string, itemId: string, req: CreatePortfolioItemRequest): Observable<OrgPortfolioItem> {
    return this.http.put<OrgPortfolioItem>(`${this.BASE}/${orgId}/portfolio/${itemId}`, req);
  }

  deletePortfolioItem(orgId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${orgId}/portfolio/${itemId}`);
  }

  // ── Applications (candidatures spontanées) ───────────────────────────────

  applyToOrg(orgId: string, req: CreateApplicationRequest): Observable<OrgApplication> {
    return this.http.post<OrgApplication>(`${this.BASE}/${orgId}/applications`, req);
  }

  getOrgApplications(orgId: string, page = 0): Observable<Page<OrgApplication>> {
    const params = new HttpParams().set('page', page).set('size', 20);
    return this.http.get<Page<OrgApplication>>(`${this.BASE}/${orgId}/applications`, { params });
  }

  getMyOrgApplications(): Observable<OrgApplication[]> {
    return this.http.get<OrgApplication[]>(`${this.BASE}/applications/mine`);
  }

  // Backend: POST /{appId}/respond (non PATCH)
  respondToApplication(orgId: string, appId: string, req: RespondApplicationRequest): Observable<OrgApplication> {
    return this.http.post<OrgApplication>(`${this.BASE}/${orgId}/applications/${appId}/respond`, req);
  }

  // Backend: DELETE /{appId}/withdraw (chemin complet avec /withdraw)
  withdrawApplication(orgId: string, appId: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${orgId}/applications/${appId}/withdraw`);
  }

  // ── RFQ (demandes de devis) ───────────────────────────────────────────────

  createRfq(orgId: string, req: CreateRfqRequest): Observable<OrgRfq> {
    return this.http.post<OrgRfq>(`${this.BASE}/${orgId}/rfq`, req);
  }

  getOrgRfqs(orgId: string, page = 0): Observable<Page<OrgRfq>> {
    const params = new HttpParams().set('page', page).set('size', 20);
    return this.http.get<Page<OrgRfq>>(`${this.BASE}/${orgId}/rfq`, { params });
  }

  getMyRfqs(): Observable<OrgRfq[]> {
    return this.http.get<OrgRfq[]>(`${this.BASE}/rfq/mine`);
  }

  // Backend: POST /{rfqId}/respond (non PATCH)
  respondToRfq(orgId: string, rfqId: string, req: RfqResponseRequest): Observable<OrgRfq> {
    return this.http.post<OrgRfq>(`${this.BASE}/${orgId}/rfq/${rfqId}/respond`, req);
  }

  // Backend: POST /{rfqId}/close (non DELETE)
  closeRfq(orgId: string, rfqId: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/${orgId}/rfq/${rfqId}/close`, null);
  }

  // ── Badges ────────────────────────────────────────────────────────────────

  getBadges(orgId: string): Observable<OrgBadgeInfo> {
    return this.http.get<OrgBadgeInfo>(`${this.BASE}/${orgId}/badges`);
  }

  recomputeBadges(orgId: string): Observable<OrgBadgeInfo> {
    return this.http.post<OrgBadgeInfo>(`${this.BASE}/${orgId}/badges/recompute`, {});
  }

  // ── Matching ──────────────────────────────────────────────────────────────

  matchOrganizations(req: MatchingRequest): Observable<OrganizationSummary[]> {
    return this.http.post<OrganizationSummary[]>(`${this.BASE}/matching`, req);
  }

  // ── RGPD Export ───────────────────────────────────────────────────────────

  // Backend GdprController est à /api/gdpr/export (non /api/organizations/gdpr/export)
  exportGdprData(): Observable<Blob> {
    return this.http.get(`${environment.organizationsApiUrl}/gdpr/export`, { responseType: 'blob' });
  }
}
