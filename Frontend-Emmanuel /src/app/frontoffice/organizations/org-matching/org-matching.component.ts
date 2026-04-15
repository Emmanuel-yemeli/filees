import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { OrganizationService } from '@core/services/organization.service';
import { OrganizationSummary, OrganizationType, MatchingRequest } from '@core/models/organization.model';

@Component({
  selector: 'app-org-matching',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatSliderModule
  ],
  templateUrl: './org-matching.component.html',
  styleUrls: ['./org-matching.component.scss']
})
export class OrgMatchingComponent {
  readonly orgTypes = Object.values(OrganizationType);

  results   = signal<OrganizationSummary[]>([]);
  isLoading = signal(false);
  searched  = signal(false);

  tagInput = '';
  form: MatchingRequest = {
    requiredSpecialties: [],
    minRating: undefined,
    minProjects: undefined,
    preferredType: undefined
  };

  constructor(private orgService: OrganizationService, private router: Router) {}

  addTag() {
    const t = this.tagInput.trim();
    if (t && !this.form.requiredSpecialties?.includes(t)) {
      this.form.requiredSpecialties = [...(this.form.requiredSpecialties ?? []), t];
    }
    this.tagInput = '';
  }

  removeTag(tag: string) {
    this.form.requiredSpecialties = this.form.requiredSpecialties?.filter(t => t !== tag);
  }

  search() {
    this.isLoading.set(true);
    this.searched.set(false);
    this.orgService.matchOrganizations(this.form).subscribe({
      next: list => { this.results.set(list); this.isLoading.set(false); this.searched.set(true); },
      error: () => this.isLoading.set(false)
    });
  }

  viewOrg(id: string) { this.router.navigate(['/organizations', id]); }

  stars(n: number): string { return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)); }
}
