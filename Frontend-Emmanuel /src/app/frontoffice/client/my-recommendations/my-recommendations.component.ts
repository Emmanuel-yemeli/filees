import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RecommendationService, Recommendation, RecommendationStatus } from '../../../core/services/recommendation.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './my-recommendations.component.html',
  styleUrl: './my-recommendations.component.scss'
})
export class MyRecommendationsComponent implements OnInit {
  searchQuery = '';
  statusFilter = 'all';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Make enum available in template
  RecommendationStatus = RecommendationStatus;

  statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  recommendations: Recommendation[] = [];
  filteredRecommendations: Recommendation[] = [];

  constructor(
    private router: Router,
    private recommendationService: RecommendationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadRecommendations();
  }

  loadRecommendations() {
    this.isLoading = true;
    this.errorMessage = '';
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      this.errorMessage = 'User not authenticated';
      this.isLoading = false;
      return;
    }

    // Parse user ID to number
    const clientId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
    
    this.recommendationService.getRecommendationsByClientId(clientId).subscribe({
      next: (data) => {
        this.recommendations = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading recommendations:', error);
        this.errorMessage = 'Failed to load recommendations';
        this.isLoading = false;
        this.recommendations = [];
        this.filteredRecommendations = [];
      }
    });
  }
  applyFilters() {
    this.filteredRecommendations = this.recommendations.filter(rec => {
      // Status filter
      if (this.statusFilter !== 'all' && rec.status !== this.statusFilter) {
        return false;
      }

      // Search filter - Note: Backend returns IDs, may need to fetch names separately
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        // Search in message or other fields since we may not have names directly
        return rec.message?.toLowerCase().includes(query) ||
               rec.id.toString().includes(query);
      }

      return true;
    });
  }

  onStatusFilterChange(status: string) {
    this.statusFilter = status;
    this.applyFilters();
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.applyFilters();
  }

  viewDetail(recommendationId: number) {
    this.router.navigate(['/frontoffice/client/my-recommendations', recommendationId]);
  }

  sendReminder(recommendationId: number) {
    this.isLoading = true;
    this.recommendationService.sendReminder(recommendationId).subscribe({
      next: (updated) => {
        this.successMessage = 'Reminder sent successfully!';
        // Update the local recommendation
        const index = this.recommendations.findIndex(r => r.id === recommendationId);
        if (index !== -1) {
          this.recommendations[index] = updated;
          this.applyFilters();
        }
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error sending reminder:', error);
        this.errorMessage = 'Failed to send reminder';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  cancelRecommendation(recommendationId: number) {
    if (!confirm('Are you sure you want to cancel this recommendation?')) {
      return;
    }

    const reason = prompt('Please provide a reason for cancellation (optional):');
    
    this.isLoading = true;
    this.recommendationService.cancelRecommendation(recommendationId, reason || undefined).subscribe({
      next: (updated) => {
        this.successMessage = 'Recommendation cancelled successfully!';
        // Update the local recommendation
        const index = this.recommendations.findIndex(r => r.id === recommendationId);
        if (index !== -1) {
          this.recommendations[index] = updated;
          this.applyFilters();
        }
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error cancelling recommendation:', error);
        this.errorMessage = 'Failed to cancel recommendation';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  createProject(recommendationId: number) {
    console.log('Create project from recommendation:', recommendationId);
    this.router.navigate(['/client/projects/create'], { 
      queryParams: { recommendationId } 
    });
  }

  recommendForAnother(recommendationId: number) {
    console.log('Recommend freelancer for another offer:', recommendationId);
    // Open recommendation modal with this freelancer
  }

  getStatusIcon(status: RecommendationStatus): string {
    const icons: Record<string, string> = {
      'PENDING': '⏳',
      'ACCEPTED': '✅',
      'REJECTED': '❌',
      'CANCELLED': '🚫',
      'EXPIRED': '⏰'
    };
    return icons[status] || '⏳';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled',
      EXPIRED: 'Expired'
    };
    return labels[status] || status;
  }

  getStatusClass(status: RecommendationStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US');
  }

  getEmoji(type: string): string {
    const emojis: Record<string, string> = {
      freelancer: '👤',
      job: '📱',
      money: '💰',
      calendar: '📅',
      view: '👁️',
      reminder: '🔔',
      message: '💬',
      check: '✓',
      cross: '✗'
    };
    return emojis[type] || '';
  }
}
