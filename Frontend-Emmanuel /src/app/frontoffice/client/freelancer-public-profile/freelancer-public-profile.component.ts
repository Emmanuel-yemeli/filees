import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FreelanceProfileService } from '@core/services/freelance-profile.service';
import { FreelanceProfile, Availability } from '@core/models/freelance-profile.model';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { ReputationBadgeComponent } from '../../../shared/components/reputation-badge/reputation-badge.component';

@Component({
  selector: 'app-freelancer-public-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatCardModule,
    ReputationBadgeComponent
  ],
  templateUrl: './freelancer-public-profile.component.html',
  styleUrls: ['./freelancer-public-profile.component.scss']
})
export class FreelancerPublicProfileComponent implements OnInit {
  profile: FreelanceProfile | null = null;
  loading = true;
  error = false;
  Availability = Availability;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileService: FreelanceProfileService
  ) {}

  ngOnInit(): void {
    const profileId = this.route.snapshot.paramMap.get('id');
    if (profileId) {
      this.loadProfile(profileId);
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  loadProfile(profileId: string): void {
    this.loading = true;
    this.profileService.getProfileById(profileId).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/frontoffice/client/freelancers']);
  }

  sendInvitation(): void {
    // TODO: Implement invitation functionality
    console.log('Send invitation to:', this.profile?.id);
  }

  contactFreelancer(): void {
    // TODO: Implement messaging functionality
    console.log('Contact freelancer:', this.profile?.id);
  }
}
