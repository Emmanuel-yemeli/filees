import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RecommendationModalComponent } from '../recommendation-modal/recommendation-modal.component';
import { RecommendationService } from '../../../core/services/recommendation.service';
import { InviteFreelancerModalComponent } from '../invite-freelancer-modal/invite-freelancer-modal.component';
import { FreelanceInvitationService } from '../../../core/services/freelance-invitation.service';
import { UserService } from '../../../core/services/user.service';
import { User, UserType } from '../../../shared/models/user.model';

interface Freelancer {
  id: string;
  name: string;
  title: string;
  location: string;
  available: boolean;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  experience: number;
  successRate: number;
  skills: string[];
  availableIn?: string;
}

@Component({
  selector: 'app-search-freelancers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSliderModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './search-freelancers.component.html',
  styleUrl: './search-freelancers.component.scss'
})
export class SearchFreelancersComponent implements OnInit {
  searchQuery = '';
  selectedSkills: string[] = [];
  availableSkills = ['React', 'Node.js', 'Python', 'Angular', 'Vue.js', 'MongoDB', 'AWS', 'Docker'];
  
  // Filters
  experienceFilter = 'all';
  experienceOptions = [
    { value: 'all', label: 'All' },
    { value: '0-2', label: '0-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5+', label: '5+ years' }
  ];
  
  minRate = 0;
  maxRate = 1000;
  minRating = 0;
  
  availabilityFilters = {
    immediate: true,
    twoWeeks: true,
    month: false
  };
  
  sortBy = 'rating';
  isLoading = false;
  
  // Real data from backend
  freelancers: Freelancer[] = [];
  
  filteredFreelancers: Freelancer[] = [];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private recommendationService: RecommendationService,
    private invitationService: FreelanceInvitationService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadFreelancers();
  }

  loadFreelancers() {
    this.isLoading = true;
    // Fetch only FREELANCE type users via the specific endpoint
    this.userService.getUsersByType(UserType.FREELANCE).subscribe({
      next: (response) => {
        // Map User to Freelancer interface
        this.freelancers = response.content.map(user => this.mapUserToFreelancer(user));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading freelancers:', error);
        this.translate.get('search.errorLoading').subscribe((msg: string) => {
          this.snackBar.open(msg || 'Error loading freelancers', 'OK', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        });
        this.isLoading = false;
      }
    });
  }

  mapUserToFreelancer(user: User): Freelancer {
    return {
      id: user.id, // Use the full UUID
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Freelancer',
      title: 'Freelancer', // Default title for users without profile
      location: 'Not specified',
      available: true, // Available by default
      availableIn: undefined,
      rating: 4.0, // Default rating
      reviewCount: 0,
      hourlyRate: 50, // Default rate
      experience: 0, // Default experience
      successRate: 0,
      skills: [] // No skills if no profile
    };
  }

  onSkillSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
  }

  toggleSkill(skill: string) {
    const index = this.selectedSkills.indexOf(skill);
    if (index > -1) {
      this.selectedSkills.splice(index, 1);
    } else {
      this.selectedSkills.push(skill);
    }
    this.applyFilters();
  }

  removeSkill(skill: string) {
    const index = this.selectedSkills.indexOf(skill);
    if (index > -1) {
      this.selectedSkills.splice(index, 1);
    }
    this.applyFilters();
  }

  applyFilters() {
    this.filteredFreelancers = this.freelancers.filter(freelancer => {
      // Experience filter
      if (this.experienceFilter !== 'all') {
        const [min, max] = this.experienceFilter.includes('+') 
          ? [5, Infinity] 
          : this.experienceFilter.split('-').map(Number);
        if (freelancer.experience < min || (max && freelancer.experience > max)) {
          return false;
        }
      }

      // Rate filter
      if (freelancer.hourlyRate < this.minRate || freelancer.hourlyRate > this.maxRate) {
        return false;
      }

      // Rating filter
      if (freelancer.rating < this.minRating) {
        return false;
      }

      // Skills filter
      if (this.selectedSkills.length > 0) {
        const hasAllSkills = this.selectedSkills.every(skill => 
          freelancer.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        );
        if (!hasAllSkills) {
          return false;
        }
      }

      return true;
    });

    this.sortFreelancers();
  }

  resetFilters() {
    this.selectedSkills = [];
    this.experienceFilter = 'all';
    this.minRate = 0;
    this.maxRate = 1000;
    this.minRating = 0;
    this.availabilityFilters = {
      immediate: true,
      twoWeeks: true,
      month: false
    };
    this.applyFilters();
  }

  sortFreelancers() {
    this.filteredFreelancers.sort((a, b) => {
      switch (this.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'rate':
          return a.hourlyRate - b.hourlyRate;
        case 'experience':
          return b.experience - a.experience;
        default:
          return 0;
      }
    });
  }

  onSortChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.sortBy = select.value;
    this.sortFreelancers();
  }

  viewProfile(freelancerId: string) {
    // Find the original profile UUID
    const freelancer = this.freelancers.find(f => f.id === freelancerId);
    if (freelancer) {
      // Use the original UUID from the backend
      const profile = this.filteredFreelancers.find(f => f.id === freelancerId);
      this.router.navigate(['/frontoffice/client/freelancers', freelancerId]);
    }
  }

  openRecommendationModal(freelancerId: string) {
    const freelancer = this.freelancers.find(f => f.id === freelancerId);
    if (!freelancer) return;

    const dialogRef = this.dialog.open(RecommendationModalComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: { freelancer }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Submit recommendation
        this.recommendationService.createRecommendation(result).subscribe({
          next: (response) => {
            console.log('Recommendation created successfully:', response);
            alert('Recommendation sent successfully!');
          },
          error: (error) => {
            console.error('Error creating recommendation:', error);
            alert('Error sending recommendation');
          }
        });
      }
    });
  }

  openInviteModal(freelancerId: string) {
    const freelancer = this.freelancers.find(f => f.id === freelancerId);
    if (!freelancer) return;

    const dialogRef = this.dialog.open(InviteFreelancerModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { freelancer }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('📤 Dialog result (invitation data):', result);
        // Submit invitation
        this.invitationService.createInvitation(result).subscribe({
          next: (response) => {
            console.log('✅ Invitation sent successfully:', response);
            this.translate.get('invite.successMessage').subscribe((msg: string) => {
              this.snackBar.open(msg, 'OK', {
                duration: 5000,
                panelClass: ['success-snackbar']
              });
            });
          },
          error: (error) => {
            console.error('❌ Error sending invitation:', error);
            if (error.error) {
              console.error('Error details:', error.error);
            }
            this.translate.get('invite.errorMessage').subscribe((msg: string) => {
              this.snackBar.open(msg, 'OK', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            });
          }
        });
      }
    });
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }
}