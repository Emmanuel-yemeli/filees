import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, clientGuard, freelancerGuard, supportAgentGuard } from './core/guards/role.guard';
import { UserRole } from './shared/models/user.model';

import { LoginComponent } from './shared/modules/user/login/login.component';
import { RegisterComponent } from './shared/modules/user/register/register.component';
import { BackofficeLayoutComponent } from './backoffice/layout/backoffice-layout.component';
import { FrontofficeLayoutComponent } from './frontoffice/layout/frontoffice-layout.component';
import { AdminDashboardComponent } from './backoffice/admin/admin-dashboard/admin-dashboard.component';
import { ClientDashboardComponent } from './frontoffice/client/client-dashboard/client-dashboard.component';
import { FreelancerDashboardComponent } from './frontoffice/freelancer/freelancer-dashboard/freelancer-dashboard.component';
import { LandingComponent } from './frontoffice/pages/landing/landing.component';

export const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register/client', component: RegisterComponent, data: { role: UserRole.CLIENT } },
  { path: 'register/freelancer', component: RegisterComponent, data: { role: UserRole.FREELANCER } },
  { path: 'register/admin', component: RegisterComponent, data: { role: UserRole.ADMIN } },
  {
    path: 'forgot-password',
    loadComponent: () => import('./shared/modules/user/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./shared/modules/user/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  // ── Organisations — pages publiques (sans auth) ─────────────────────────
  {
    path: 'organizations',
    loadComponent: () => import('./frontoffice/organizations/organization-search/organization-search.component').then(m => m.OrganizationSearchComponent)
  },
  {
    path: 'organizations/:id',
    loadComponent: () => import('./frontoffice/organizations/organization-profile/organization-profile.component').then(m => m.OrganizationProfileComponent)
  },
  // Lien email — répondre à une invitation par token
  {
    path: 'invitations/respond',
    loadComponent: () => import('./frontoffice/organizations/invitation-respond/invitation-respond.component').then(m => m.InvitationRespondComponent)
  },

  { path: 'profile',           redirectTo: '/frontoffice/profile', pathMatch: 'full' },
  { path: 'security',          redirectTo: '/frontoffice/security', pathMatch: 'full' },
  { path: 'profile/kyc',       redirectTo: '/frontoffice/kyc', pathMatch: 'full' },
  { path: 'profile/professional', redirectTo: '/frontoffice/profile/professional', pathMatch: 'full' },

  // ============================================================
  // BACK OFFICE — Admin + Agent
  // ============================================================
  {
    path: 'backoffice',
    component: BackofficeLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },

      // ── Admin existant ──────────────────────────────────────
      { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },
      { path: 'admin/users', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/user-management/user-management.component').then(m => m.UserManagementComponent) },
      { path: 'admin/kyc', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/modules/kyc-verification/kyc-verification.component').then(m => m.KycVerificationComponent) },
      { path: 'admin/jobs', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/modules/admin-jobs/admin-jobs.component').then(m => m.AdminJobsComponent) },
      { path: 'admin/analytics/jobs', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/modules/job-analytics/job-analytics.component').then(m => m.JobAnalyticsComponent) },
      { path: 'admin/projects', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/modules/admin-projects/admin-projects.component').then(m => m.AdminProjectsComponent) },
      { path: 'admin/projects/:id', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/modules/admin-project-detail/admin-project-detail.component').then(m => m.AdminProjectDetailComponent) },
      { path: 'admin/projects/:id/milestones/:milestoneId/mediate', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/modules/milestone-mediation/milestone-mediation.component').then(m => m.MilestoneMediationComponent) },
      { path: 'admin/analytics/milestones', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/modules/milestone-analytics/milestone-analytics.component').then(m => m.MilestoneAnalyticsComponent) },
      { path: 'admin/recommendations', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/modules/admin-recommendations/admin-recommendations.component').then(m => m.AdminRecommendationsComponent) },
      { path: 'admin/analytics/recommendations', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/modules/recommendation-analytics/recommendation-analytics.component').then(m => m.RecommendationAnalyticsComponent) },
      { path: 'admin/audit-log', canActivate: [adminGuard], loadComponent: () => import('./backoffice/admin/modules/audit-log/audit-log-admin.component').then(m => m.AuditLogAdminComponent) },
      // ── NOUVEAU : Admin — Module Organisations ──────────────
      {
        path: 'admin/organizations',
        canActivate: [adminGuard],
        loadComponent: () => import('./backoffice/admin/modules/organizations/admin-organizations.component').then(m => m.AdminOrganizationsComponent)
      },
      { path: 'admin/security', canActivate: [adminGuard], loadComponent: () => import('./shared/modules/user/security-settings/security-settings.component').then(m => m.SecuritySettingsComponent) },
      { path: 'admin/profile', canActivate: [adminGuard], loadComponent: () => import('./shared/modules/user/profile/profile.component').then(m => m.ProfileComponent) },

      // ── NOUVEAU : Admin — Module Réclamations ───────────────
      {
        path: 'admin/complaints',
        canActivate: [adminGuard],
        loadComponent: () => import('./backoffice/admin/modules/complaints/admin-complaints.component').then(m => m.AdminComplaintsComponent)
      },
      // ── NOUVEAU : Fonctionnalités avancées complaints ────────
      {
        path: 'admin/complaints/sla-rules',
        canActivate: [adminGuard],
        loadComponent: () => import('./backoffice/admin/modules/complaints/admin-sla-rules.component').then(m => m.AdminSlaRulesComponent)
      },
      {
        path: 'admin/complaints/risk',
        canActivate: [adminGuard],
        loadComponent: () => import('./backoffice/admin/modules/complaints/admin-risk-dashboard.component').then(m => m.AdminRiskDashboardComponent)
      },
      {
        path: 'admin/complaints/nps',
        canActivate: [adminGuard],
        loadComponent: () => import('./backoffice/admin/modules/complaints/admin-nps-stats.component').then(m => m.AdminNpsStatsComponent)
      },
      {
        path: 'admin/complaints/templates',
        canActivate: [adminGuard],
        loadComponent: () => import('./backoffice/admin/modules/complaints/admin-response-templates.component').then(m => m.AdminResponseTemplatesComponent)
      },
      {
        path: 'admin/complaints/:id',
        canActivate: [adminGuard],
        loadComponent: () => import('./backoffice/admin/modules/complaints/admin-complaint-detail.component').then(m => m.AdminComplaintDetailComponent)
      },
      {
        path: 'admin/complaints/stats',
        canActivate: [adminGuard],
        loadComponent: () => import('./backoffice/admin/modules/complaints/admin-complaints-stats.component').then(m => m.AdminComplaintsStatsComponent)
      },

      // ── NOUVEAU : Agent — Module Réclamations ───────────────
      {
        path: 'agent/queue',
        canActivate: [supportAgentGuard],
        loadComponent: () => import('./backoffice/agent/agent-queue.component').then(m => m.AgentQueueComponent)
      },
      {
        path: 'agent/my-assigned',
        canActivate: [supportAgentGuard],
        loadComponent: () => import('./backoffice/agent/agent-my-assigned.component').then(m => m.AgentMyAssignedComponent)
      },
      {
        path: 'agent/complaints/:id',
        canActivate: [supportAgentGuard],
        loadComponent: () => import('./backoffice/agent/agent-complaint-detail.component').then(m => m.AgentComplaintDetailComponent)
      }
    ]
  },

  // ============================================================
  // FRONT OFFICE — Client + Freelancer
  // ============================================================
  {
    path: 'frontoffice',
    component: FrontofficeLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'profile', loadComponent: () => import('./shared/modules/user/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'security', loadComponent: () => import('./shared/modules/user/security-settings/security-settings.component').then(m => m.SecuritySettingsComponent) },
      { path: 'kyc', loadComponent: () => import('./shared/modules/user/kyc/user-kyc.component').then(m => m.UserKycComponent) },
      { path: 'profile/professional', canActivate: [freelancerGuard], loadComponent: () => import('./frontoffice/freelancer/freelancer-profile/freelancer-profile.component').then(m => m.FreelancerProfileComponent) },

      // ── Organisations ────────────────────────────────────────
      {
        path: 'my-organizations',
        loadComponent: () => import('./frontoffice/organizations/my-organizations/my-organizations.component').then(m => m.MyOrganizationsComponent)
      },
      {
        path: 'my-organizations/create',
        loadComponent: () => import('./frontoffice/organizations/create-organization/create-organization.component').then(m => m.CreateOrganizationComponent)
      },
      {
        path: 'my-organizations/:id/settings',
        loadComponent: () => import('./frontoffice/organizations/organization-settings/organization-settings.component').then(m => m.OrganizationSettingsComponent)
      },
      {
        path: 'my-org-invitations',
        loadComponent: () => import('./frontoffice/organizations/my-org-invitations/my-org-invitations.component').then(m => m.MyOrgInvitationsComponent)
      },
      {
        path: 'my-org-applications',
        loadComponent: () => import('./frontoffice/organizations/my-org-applications/my-org-applications.component').then(m => m.MyOrgApplicationsComponent)
      },
      {
        path: 'my-org-rfqs',
        loadComponent: () => import('./frontoffice/organizations/my-org-rfqs/my-org-rfqs.component').then(m => m.MyOrgRfqsComponent)
      },
      {
        path: 'org-matching',
        loadComponent: () => import('./frontoffice/organizations/org-matching/org-matching.component').then(m => m.OrgMatchingComponent)
      },

      // ── Route neutre pour les liens dans les emails ──────────
      {
        path: 'my-complaints/:id',
        loadComponent: () => import('./shared/components/complaint-redirect/complaint-redirect.component').then(m => m.ComplaintRedirectComponent)
      },

      // ── Client ──────────────────────────────────────────────
      {
        path: 'client',
        canActivate: [clientGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: ClientDashboardComponent },
          { path: 'create-job', loadComponent: () => import('./frontoffice/client/create-job-offer/create-job-offer.component').then(m => m.CreateJobOfferComponent) },
          { path: 'edit-job/:id', loadComponent: () => import('./frontoffice/client/create-job-offer/create-job-offer.component').then(m => m.CreateJobOfferComponent) },
          { path: 'my-jobs', loadComponent: () => import('./frontoffice/client/my-jobs/my-jobs.component').then(m => m.MyJobsComponent) },
          { path: 'my-jobs/:id', loadComponent: () => import('./frontoffice/client/job-detail-client/job-detail-client.component').then(m => m.JobDetailClientComponent) },
          { path: 'my-jobs/:jobId/applications/:applicationId', loadComponent: () => import('./frontoffice/client/job-detail-client/job-detail-client.component').then(m => m.JobDetailClientComponent) },
          { path: 'freelancers', loadComponent: () => import('./frontoffice/client/search-freelancers/search-freelancers.component').then(m => m.SearchFreelancersComponent) },
          { path: 'freelancers/:id', loadComponent: () => import('./frontoffice/client/freelancer-public-profile/freelancer-public-profile.component').then(m => m.FreelancerPublicProfileComponent) },
          { path: 'my-recommendations', loadComponent: () => import('./frontoffice/client/my-recommendations/my-recommendations.component').then(m => m.MyRecommendationsComponent) },
          { path: 'my-recommendations/:id', loadComponent: () => import('./frontoffice/client/recommendation-detail/recommendation-detail.component').then(m => m.RecommendationDetailComponent) },
          { path: 'projects', loadComponent: () => import('./frontoffice/client/modules/project/client-projects/client-projects.component').then(m => m.ClientProjectsComponent) },
          { path: 'projects/create', loadComponent: () => import('./frontoffice/client/modules/project/create-project/create-project.component').then(m => m.CreateProjectComponent) },
          { path: 'projects/:id/dashboard', loadComponent: () => import('./frontoffice/client/modules/project/client-project-dashboard/client-project-dashboard.component').then(m => m.ClientProjectDashboardComponent) },
          { path: 'projects/:id/milestones/:milestoneId', loadComponent: () => import('./frontoffice/client/modules/project/client-milestone-detail/client-milestone-detail.component').then(m => m.ClientMilestoneDetailComponent) },

          // ── NOUVEAU : Réclamations client ────────────────────
          {
            path: 'my-complaints',
            loadComponent: () => import('./frontoffice/client/complaints/my-complaints.component').then(m => m.MyComplaintsComponent)
          },
          {
            path: 'my-complaints/new',
            loadComponent: () => import('./frontoffice/client/complaints/create-complaint.component').then(m => m.CreateComplaintComponent)
          },
          {
            path: 'my-complaints/:id',
            loadComponent: () => import('./frontoffice/client/complaints/complaint-detail.component').then(m => m.ComplaintDetailComponent)
          }
        ]
      },

      // ── Freelancer ───────────────────────────────────────────
      {
        path: 'freelancer',
        canActivate: [freelancerGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: FreelancerDashboardComponent },
          { path: 'browse-jobs', loadComponent: () => import('./frontoffice/freelancer/browse-jobs/browse-jobs.component').then(m => m.BrowseJobsComponent) },
          { path: 'jobs/:id', loadComponent: () => import('./frontoffice/freelancer/job-detail-freelance/job-detail-freelance.component').then(m => m.JobDetailFreelanceComponent) },
          { path: 'my-applications', loadComponent: () => import('./frontoffice/freelancer/my-applications/my-applications.component').then(m => m.MyApplicationsComponent) },
          { path: 'my-invitations', loadComponent: () => import('./frontoffice/freelancer/my-invitations/my-invitations.component').then(m => m.MyInvitationsFreelancerComponent) },
          { path: 'my-invitations/:id', loadComponent: () => import('./frontoffice/freelancer/my-invitations/invitation-detail/invitation-detail.component').then(m => m.InvitationDetailFreelancerComponent) },
          { path: 'my-projects', loadComponent: () => import('./frontoffice/freelancer/modules/project/freelancer-projects/freelancer-projects.component').then(m => m.FreelancerProjectsComponent) },
          { path: 'my-projects/:id', loadComponent: () => import('./frontoffice/freelancer/modules/project/freelancer-project-dashboard/freelancer-project-dashboard.component').then(m => m.FreelancerProjectDashboardComponent) },
          { path: 'my-projects/:id/milestones/:milestoneId', loadComponent: () => import('./frontoffice/freelancer/modules/project/freelancer-milestone-detail/freelancer-milestone-detail.component').then(m => m.FreelancerMilestoneDetailComponent) },

          // ── NOUVEAU : Réclamations freelancer ────────────────
          {
            path: 'my-complaints',
            loadComponent: () => import('./frontoffice/client/complaints/my-complaints.component').then(m => m.MyComplaintsComponent)
          },
          {
            path: 'my-complaints/new',
            loadComponent: () => import('./frontoffice/client/complaints/create-complaint.component').then(m => m.CreateComplaintComponent)
          },
          {
            path: 'my-complaints/:id',
            loadComponent: () => import('./frontoffice/client/complaints/complaint-detail.component').then(m => m.ComplaintDetailComponent)
          }
        ]
      }
    ]
  },

  { path: '**', redirectTo: '/login' }
];