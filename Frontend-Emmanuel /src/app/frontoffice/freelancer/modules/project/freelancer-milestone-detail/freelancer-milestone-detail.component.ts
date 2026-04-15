import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ProjectService } from '../../../../../core/services/project.service';
import { ProjectMilestone } from '../../../../../core/models/project.model';

@Component({
  selector: 'app-freelancer-milestone-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatCheckboxModule
  ],
  templateUrl: './freelancer-milestone-detail.component.html',
  styleUrls: ['./freelancer-milestone-detail.component.scss']
})
export class FreelancerMilestoneDetailComponent implements OnInit {
  milestone: ProjectMilestone | null = null;
  projectId: string | null = null;
  submissionForm: FormGroup;
  loading = true;
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private fb: FormBuilder
  ) {
    this.submissionForm = this.fb.group({
      comment: [''],
      attachments: [''],
      confirmCriteria: [false, Validators.requiredTrue]
    });
  }

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

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.submissionForm.patchValue({
        attachments: JSON.stringify(Array.from(files).map((f: any) => f.name))
      });
    }
  }

  submitMilestone(): void {
    if (!this.milestone?.id || !this.submissionForm.valid) {
      alert('Please fill in all required fields');
      return;
    }

    this.submitting = true;
    const submissionData = {
      attachments: this.submissionForm.value.attachments || '[]',
      comment: this.submissionForm.value.comment
    };

    this.projectService.submitMilestone(this.milestone.id, submissionData).subscribe({
      next: () => {
        alert('Milestone submitted successfully!');
        window.history.back();
      },
      error: (error) => {
        console.error('Error submitting milestone:', error);
        alert('Error submitting milestone');
        this.submitting = false;
      }
    });
  }

  canSubmit(): boolean {
    return this.milestone?.status === 'IN_PROGRESS' || this.milestone?.status === 'REJECTED' || this.milestone?.status === 'PENDING';
  }
}
