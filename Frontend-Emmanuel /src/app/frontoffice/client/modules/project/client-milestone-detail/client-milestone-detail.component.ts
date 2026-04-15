import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { ProjectService } from '../../../../../core/services/project.service';
import { ProjectMilestone } from '../../../../../core/models/project.model';

@Component({
  selector: 'app-client-milestone-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  templateUrl: './client-milestone-detail.component.html',
  styleUrls: ['./client-milestone-detail.component.scss']
})
export class ClientMilestoneDetailComponent implements OnInit {
  milestone: ProjectMilestone | null = null;
  projectId: string | null = null;
  rejectionReason: string = '';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    const milestoneId = this.route.snapshot.paramMap.get('milestoneId');
    
    if (milestoneId) {
      this.loadMilestone(milestoneId);
    }
  }

  loadMilestone(id: string): void {
    this.loading = true;
    this.projectService.getMilestoneById(id).subscribe({
      next: (milestone) => {
        this.milestone = milestone;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading milestone:', error);
        this.loading = false;
      }
    });
  }

  approveMilestone(): void {
    if (!this.milestone?.id) return;
    
    if (confirm('Are you sure you want to approve this milestone?')) {
      this.projectService.approveMilestone(this.milestone.id).subscribe({
        next: () => {
          alert('Milestone approved successfully');
          window.history.back();
        },
        error: (error) => {
          console.error('Error approving milestone:', error);
          alert('Error approving milestone');
        }
      });
    }
  }

  requestRevisions(): void {
    if (!this.milestone?.id || !this.rejectionReason.trim()) {
      alert('Please provide a reason for requesting revisions');
      return;
    }
    
    this.projectService.rejectMilestone(this.milestone.id, this.rejectionReason).subscribe({
      next: () => {
        alert('Revisions requested');
        window.history.back();
      },
      error: (error) => {
        console.error('Error requesting revisions:', error);
        alert('Error requesting revisions');
      }
    });
  }
}
