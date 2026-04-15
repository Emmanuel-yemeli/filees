import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { OrganizationService } from '../../../core/services/organization.service';
import {
  CreateOrganizationRequest, OrganizationType, OrganizationSize
} from '../../../core/models/organization.model';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule
  ],
  templateUrl: './create-organization.component.html'
})
export class CreateOrganizationComponent {
  private orgService = inject(OrganizationService);
  private router     = inject(Router);

  readonly types      = Object.values(OrganizationType);
  readonly sizes      = Object.values(OrganizationSize);
  readonly separators = [ENTER, COMMA];

  form: CreateOrganizationRequest = {
    name: '', description: '', logoUrl: '', website: '',
    type: OrganizationType.AGENCY, specialties: [], location: '', siret: '',
    size: OrganizationSize.SMALL
  };

  isSubmitting = signal(false);
  error        = signal<string | null>(null);
  success      = signal(false);

  addSpecialty(event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (value) this.form.specialties = [...(this.form.specialties ?? []), value];
    event.chipInput!.clear();
  }

  removeSpecialty(s: string) {
    this.form.specialties = (this.form.specialties ?? []).filter(x => x !== s);
  }

  submit() {
    if (!this.form.name || !this.form.type) { this.error.set('Nom et type sont requis.'); return; }
    this.isSubmitting.set(true);
    this.error.set(null);
    this.orgService.create(this.form).subscribe({
      next: org => {
        this.success.set(true);
        this.isSubmitting.set(false);
        setTimeout(() => this.router.navigate(['/frontoffice/my-organizations', org.id, 'settings']), 1500);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Erreur lors de la création.');
        this.isSubmitting.set(false);
      }
    });
  }

  cancel() { this.router.navigate(['/frontoffice/my-organizations']); }
}
