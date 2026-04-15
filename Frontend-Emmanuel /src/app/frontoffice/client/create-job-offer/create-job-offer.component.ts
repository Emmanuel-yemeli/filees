import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JobOfferService } from '@core/services/job-offer.service';
import { AuthService } from '@core/services/auth.service';
import { 
  CreateJobOfferDto, 
  JobCategory, 
  BudgetType, 
  ExperienceLevel,
  JobOfferStatus
} from '@core/models/job-offer.model';

@Component({
  selector: 'app-create-job-offer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-job-offer.component.html',
  styleUrls: ['./create-job-offer.component.scss']
})
export class CreateJobOfferComponent implements OnInit {
  jobOfferForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  
  // Enums for template
  categories = Object.values(JobCategory);
  budgetTypes = Object.values(BudgetType);
  experienceLevels = Object.values(ExperienceLevel);
  
  // Skills management
  availableSkills: string[] = [
    'Angular', 'React', 'Vue.js', 'Node.js', 'Java', 'Python', 'PHP',
    'JavaScript', 'TypeScript', 'HTML', 'CSS', 'SCSS', 'Bootstrap',
    'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
    'SEO', 'Content Writing', 'Digital Marketing', 'Social Media'
  ];
  selectedSkills: string[] = [];
  newSkillInput: string = '';
  
  // File management
  uploadedFiles: File[] = [];

  constructor(
    private fb: FormBuilder,
    private jobOfferService: JobOfferService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.jobOfferForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(50)]],
      budget: ['', [Validators.required, Validators.min(0)]],
      budgetType: [BudgetType.FIXED, Validators.required],
      estimatedDuration: ['', [Validators.required, Validators.min(1)]],
      deadline: ['', Validators.required],
      experienceLevel: [ExperienceLevel.INTERMEDIATE, Validators.required],
      location: ['', Validators.required],
      isRemote: [false]
    });
  }

  toggleSkill(skill: string): void {
    const index = this.selectedSkills.indexOf(skill);
    if (index > -1) {
      this.selectedSkills.splice(index, 1);
    } else {
      this.selectedSkills.push(skill);
    }
  }

  isSkillSelected(skill: string): boolean {
    return this.selectedSkills.includes(skill);
  }

  addCustomSkill(): void {
    const skill = this.newSkillInput.trim();
    if (!skill) return;
    
    // Check if skill already exists (case insensitive)
    const skillExists = [...this.availableSkills, ...this.selectedSkills]
      .some(s => s.toLowerCase() === skill.toLowerCase());
    
    if (skillExists) {
      alert('This skill already exists!');
      return;
    }
    
    // Add to available skills and select it
    this.availableSkills.push(skill);
    this.selectedSkills.push(skill);
    this.newSkillInput = '';
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.uploadedFiles.push(files[i]);
      }
    }
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  async saveDraft(): Promise<void> {
    if (this.jobOfferForm.invalid) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    await this.submitJobOffer(JobOfferStatus.DRAFT);
  }

  async publish(): Promise<void> {
    if (this.jobOfferForm.invalid) {
      this.errorMessage = 'Please fill in all required fields';
      this.jobOfferForm.markAllAsTouched();
      return;
    }

    if (this.selectedSkills.length === 0) {
      this.errorMessage = 'Please select at least one skill';
      return;
    }

    await this.submitJobOffer(JobOfferStatus.OPEN);
  }

  private async submitJobOffer(status: JobOfferStatus): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      // Upload files if any
      let attachments: string[] = [];
      if (this.uploadedFiles.length > 0) {
        const uploadResult = await this.jobOfferService.uploadAttachments(this.uploadedFiles).toPromise();
        attachments = uploadResult || [];
      }

      // Get current user's ID
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.errorMessage = 'You must be logged in to create an offer';
        this.isSubmitting = false;
        return;
      }

      const formValue = this.jobOfferForm.value;
      const jobOfferDto: CreateJobOfferDto = {
        clientId: currentUser.id,
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        budget: formValue.budget,
        budgetType: formValue.budgetType,
        estimatedDuration: formValue.estimatedDuration,
        deadline: new Date(formValue.deadline),
        requiredSkills: this.selectedSkills,
        experienceLevel: formValue.experienceLevel,
        location: formValue.location,
        isRemote: formValue.isRemote,
        attachments: attachments,
        status: status
      };

      // Debug: Log the data being sent
      console.log('Sending job offer data:', JSON.stringify(jobOfferDto, null, 2));

      const result = await this.jobOfferService.createJobOffer(jobOfferDto).toPromise();
      
      if (status === JobOfferStatus.DRAFT) {
        alert('Offer successfully saved as draft!');
      } else {
        alert('Offer successfully published!');
      }
      
      this.router.navigate(['/frontoffice/client/my-jobs']);
    } catch (error: any) {
      console.error('Error creating job offer:', error);
      
      // Extract error message from backend response
      if (error.error) {
        if (typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else if (error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = JSON.stringify(error.error);
        }
      } else if (error.message) {
        this.errorMessage = error.message;
      } else {
        this.errorMessage = 'An error occurred while creating the offer';
      }
      
      alert('Error: ' + this.errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/frontoffice/client/dashboard']);
  }
}
