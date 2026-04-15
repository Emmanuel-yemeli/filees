import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { FreelanceInvitationService } from '@core/services/freelance-invitation.service';
import { FreelanceInvitation, InvitationStatus } from '@core/models/freelance-invitation.model';

@Component({
  selector: 'app-my-invitations-freelancer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatTabsModule
  ],
  templateUrl: './my-invitations.component.html',
  styleUrls: ['./my-invitations.component.scss']
})
export class MyInvitationsFreelancerComponent implements OnInit {
  invitations: FreelanceInvitation[] = [];
  filteredInvitations: FreelanceInvitation[] = [];
  isLoading = true;
  activeTab = 'all';
  activeTabIndex = 0;
  InvitationStatus = InvitationStatus;

  tabs = [
    { id: 'all', label: 'invitations.tabs.all' },
    { id: 'pending', label: 'invitations.tabs.pending', status: InvitationStatus.PENDING },
    { id: 'accepted', label: 'invitations.tabs.accepted', status: InvitationStatus.ACCEPTED },
    { id: 'declined', label: 'invitations.tabs.declined', status: InvitationStatus.DECLINED }
  ];

  constructor(
    private invitationService: FreelanceInvitationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInvitations();
  }

  loadInvitations(): void {
    this.isLoading = true;
    this.invitationService.getReceivedInvitations().subscribe({
      next: (invitations) => {
        this.invitations = invitations;
        this.filterInvitations();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading invitations:', error);
        this.isLoading = false;
      }
    });
  }

  onTabChange(index: number): void {
    this.activeTab = this.tabs[index].id;
    this.filterInvitations();
  }

  changeTab(tabId: string): void {
    this.activeTab = tabId;
    this.activeTabIndex = this.tabs.findIndex(t => t.id === tabId);
    this.filterInvitations();
  }

  filterInvitations(): void {
    const tab = this.tabs.find(t => t.id === this.activeTab);
    if (!tab || tab.id === 'all') {
      this.filteredInvitations = this.invitations;
    } else {
      this.filteredInvitations = this.invitations.filter(inv => inv.status === tab.status);
    }
  }

  getTabCount(tabId: string): number {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab || tab.id === 'all') {
      return this.invitations.length;
    }
    return this.invitations.filter(inv => inv.status === tab.status).length;
  }

  viewDetails(invitationId: string): void {
    this.router.navigate(['/frontoffice/freelancer/my-invitations', invitationId]);
  }

  acceptInvitation(invitation: FreelanceInvitation, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/frontoffice/freelancer/my-invitations', invitation.id]);
  }

  declineInvitation(invitation: FreelanceInvitation, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to decline this invitation?')) {
      this.invitationService.declineInvitation(invitation.id).subscribe({
        next: () => {
          alert('Invitation declined');
          this.loadInvitations();
        },
        error: (error) => {
          console.error('Error declining invitation:', error);
          alert('Error declining the invitation');
        }
      });
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusClass(status: InvitationStatus): string {
    const classes: { [key: string]: string } = {
      [InvitationStatus.PENDING]: 'badge-pending',
      [InvitationStatus.ACCEPTED]: 'badge-accepted',
      [InvitationStatus.DECLINED]: 'badge-declined',
      [InvitationStatus.EXPIRED]: 'badge-expired'
    };
    return classes[status] || 'badge-default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Pending',
      'ACCEPTED': 'Accepted',
      'DECLINED': 'Declined',
      'EXPIRED': 'Expired'
    };
    return labels[status] || status;
  }

  isExpired(invitation: FreelanceInvitation): boolean {
    if (!invitation.deadlineResponse) return false;
    return new Date(invitation.deadlineResponse) < new Date();
  }

  getDaysRemaining(deadline: Date): number {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
