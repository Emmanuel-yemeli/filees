import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RecommendationService, Recommendation, RecommendationStatus } from '../../../core/services/recommendation.service';
import { JobOfferService } from '../../../core/services/job-offer.service';
import { UserService } from '../../../core/services/user.service';
import { JobOffer } from '../../../core/models/job-offer.model';
import { User } from '../../../shared/models/user.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-recommendation-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './recommendation-detail.component.html',
  styleUrl: './recommendation-detail.component.scss'
})
export class RecommendationDetailComponent implements OnInit {
  recommendation?: Recommendation;
  jobOffer?: JobOffer;
  freelancer?: User;
  isLoading = true;
  isProcessing = false;
  RecommendationStatus = RecommendationStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recommendationService: RecommendationService,
    private jobOfferService: JobOfferService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRecommendationDetails(parseInt(id, 10));
    }
  }

  loadRecommendationDetails(id: number): void {
    this.isLoading = true;
    
    this.recommendationService.getRecommendationById(id).subscribe({
      next: (recommendation) => {
        this.recommendation = recommendation;
        
        // Load related data
        forkJoin({
          jobOffer: this.jobOfferService.getJobOfferById(recommendation.jobOfferId.toString()),
          freelancer: this.userService.getUserById(recommendation.freelanceId.toString())
        }).subscribe({
          next: (data) => {
            this.jobOffer = data.jobOffer;
            this.freelancer = data.freelancer;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading related data:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading recommendation:', error);
        this.showMessage('recommendations.errors.loadFailed', true);
        this.isLoading = false;
        this.goBack();
      }
    });
  }

  cancelRecommendation(): void {
    if (!this.recommendation) return;

    const confirmation = confirm(this.translate.instant('recommendations.confirmCancel'));
    if (!confirmation) return;

    this.isProcessing = true;
    this.recommendationService.cancelRecommendation(this.recommendation.id).subscribe({
      next: () => {
        this.showMessage('recommendations.cancelSuccess', false);
        this.goBack();
      },
      error: (error) => {
        console.error('Error canceling recommendation:', error);
        this.showMessage('recommendations.errors.cancelFailed', true);
        this.isProcessing = false;
      }
    });
  }

  sendReminder(): void {
    if (!this.recommendation) return;

    this.isProcessing = true;
    this.recommendationService.sendReminder(this.recommendation.id).subscribe({
      next: (updated) => {
        this.recommendation = updated;
        this.showMessage('recommendations.reminderSent', false);
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error sending reminder:', error);
        this.showMessage('recommendations.errors.reminderFailed', true);
        this.isProcessing = false;
      }
    });
  }

  viewJobOffer(): void {
    if (this.recommendation) {
      this.router.navigate(['/frontoffice/client/my-jobs', this.recommendation.jobOfferId]);
    }
  }

  viewFreelancerProfile(): void {
    if (this.recommendation) {
      this.router.navigate(['/frontoffice/client/freelancers', this.recommendation.freelanceId]);
    }
  }

  getStatusColor(status: RecommendationStatus): string {
    switch (status) {
      case RecommendationStatus.PENDING:
        return 'warn';
      case RecommendationStatus.ACCEPTED:
        return 'primary';
      case RecommendationStatus.REJECTED:
      case RecommendationStatus.CANCELLED:
        return 'accent';
      default:
        return '';
    }
  }

  getStatusIcon(status: RecommendationStatus): string {
    switch (status) {
      case RecommendationStatus.PENDING:
        return 'schedule';
      case RecommendationStatus.ACCEPTED:
        return 'check_circle';
      case RecommendationStatus.REJECTED:
        return 'cancel';
      case RecommendationStatus.CANCELLED:
        return 'block';
      case RecommendationStatus.EXPIRED:
        return 'access_time';
      default:
        return 'help';
    }
  }

  canCancel(): boolean {
    return this.recommendation?.status === RecommendationStatus.PENDING;
  }

  canSendReminder(): boolean {
    if (!this.recommendation) return false;
    return this.recommendation.status === RecommendationStatus.PENDING && 
           !this.recommendation.isReminderSent;
  }

  showMessage(key: string, isError: boolean): void {
    this.translate.get(key).subscribe((message: string) => {
      this.snackBar.open(message, 'OK', {
        duration: 5000,
        panelClass: isError ? ['error-snackbar'] : ['success-snackbar']
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/frontoffice/client/my-recommendations']);
  }
}
