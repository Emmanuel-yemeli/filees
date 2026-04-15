import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { OrganizationService } from '../../../core/services/organization.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models/user.model';
import {
  Organization, OrgMember, OrgReview, CreateReviewRequest
} from '../../../core/models/organization.model';
import { OrgBadgesComponent } from '../../../shared/components/org-badges/org-badges.component';
import { OrgPortfolioComponent } from '../org-portfolio/org-portfolio.component';
import { ApplyToOrgComponent } from '../apply-to-org/apply-to-org.component';
import { SubmitRfqComponent } from '../submit-rfq/submit-rfq.component';

@Component({
  selector: 'app-organization-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatChipsModule, MatProgressSpinnerModule, MatFormFieldModule,
    MatInputModule, MatDividerModule,
    OrgBadgesComponent, OrgPortfolioComponent,
    ApplyToOrgComponent, SubmitRfqComponent
  ],
  templateUrl: './organization-profile.component.html'
})
export class OrganizationProfileComponent implements OnInit {
  private orgService  = inject(OrganizationService);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private authService = inject(AuthService);

  org          = signal<Organization | null>(null);
  members      = signal<OrgMember[]>([]);
  reviews      = signal<OrgReview[]>([]);
  isLoading    = signal(true);
  isMyOrg      = signal(false);

  // Review form
  showReviewForm    = signal(false);
  reviewSubmitting  = signal(false);
  reviewSuccess     = signal(false);
  newReview: CreateReviewRequest = { qualityRating: 5, communicationRating: 5, deadlineRating: 5, valueRating: 5, comment: '' };

  // Reply
  replyingReviewId = signal<string | null>(null);
  replyText        = signal('');

  get orgId(): string { return this.route.snapshot.paramMap.get('id')!; }
  get currentUserId(): string { return this.authService.getCurrentUser()?.id ?? ''; }
  get isLoggedIn(): boolean { return !!this.authService.getCurrentUser(); }
  get isClient(): boolean { return this.authService.getCurrentUser()?.role === UserRole.CLIENT; }
  get isFreelance(): boolean { return this.authService.getCurrentUser()?.role === UserRole.FREELANCER; }

  ngOnInit() {
    this.orgService.getById(this.orgId).subscribe({
      next: o => {
        this.org.set(o);
        this.isLoading.set(false);
        this.checkMyOrg();
      },
      error: () => this.isLoading.set(false)
    });
    this.orgService.getMembers(this.orgId).subscribe({ next: m => this.members.set(m) });
    this.orgService.getReviews(this.orgId).subscribe({ next: r => this.reviews.set(r.content) });
  }

  private checkMyOrg() {
    const o = this.org();
    if (o) this.isMyOrg.set(o.ownerId === this.currentUserId);
  }

  goToSettings() { this.router.navigate(['/frontoffice/my-organizations', this.orgId, 'settings']); }

  submitReview() {
    this.reviewSubmitting.set(true);
    this.orgService.submitReview(this.orgId, this.newReview).subscribe({
      next: r => {
        this.reviews.update(list => [r, ...list]);
        this.reviewSuccess.set(true);
        this.showReviewForm.set(false);
        this.reviewSubmitting.set(false);
      },
      error: () => this.reviewSubmitting.set(false)
    });
  }

  startReply(reviewId: string) { this.replyingReviewId.set(reviewId); this.replyText.set(''); }

  submitReply(reviewId: string) {
    this.orgService.replyToReview(this.orgId, reviewId, this.replyText()).subscribe({
      next: updated => {
        this.reviews.update(list => list.map(r => r.id === reviewId ? updated : r));
        this.replyingReviewId.set(null);
      }
    });
  }

  reportReview(reviewId: string) {
    this.orgService.reportReview(this.orgId, reviewId).subscribe({
      next: updated => this.reviews.update(list => list.map(r => r.id === reviewId ? updated : r))
    });
  }

  stars(n: number): string { return '★'.repeat(n) + '☆'.repeat(5 - n); }
}
