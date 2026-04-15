import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { JobOfferService } from '@core/services/job-offer.service';
import { ApplicationService } from '@core/services/application.service';
import { AuthService } from '@core/services/auth.service';
import {
  JobOffer, JobCategory, BudgetType, ExperienceLevel, JobOfferFilters
} from '@core/models/job-offer.model';
import { JobSmartBadgesComponent } from '../../../shared/components/job-smart-badges/job-smart-badges.component';
import {
  FilterBarComponent, FilterBarConfig
} from '@shared/components/filters';

@Component({
  selector: 'app-browse-jobs',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, TranslateModule, MatIconModule,
    JobSmartBadgesComponent, FilterBarComponent
  ],
  templateUrl: './browse-jobs.component.html',
  styleUrls: ['./browse-jobs.component.scss']
})
export class BrowseJobsComponent implements OnInit, OnDestroy {
  jobs: JobOffer[] = [];
  recommendedJobs: JobOffer[] = [];
  isLoading = true;

  // Live search suggestions
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  searchSuggestions: JobOffer[] = [];
  showSuggestions = false;

  private appliedJobIds = new Set<string>();

  /** Flat state object consumed by the FilterBar */
  filters: Record<string, any> = { page: 0, size: 20 };

  /** Config-driven filter bar */
  filterConfig: FilterBarConfig = {
    searchPlaceholder: 'Rechercher une mission, un skill, un mot-clé…',
    searchKey: 'search',
    pills: {
      key: 'category',
      clearLabel: 'Toutes',
      options: [
        { value: JobCategory.DEVELOPMENT, label: 'Développement', icon: 'code' },
        { value: JobCategory.DESIGN,      label: 'Design',        icon: 'palette' },
        { value: JobCategory.MARKETING,   label: 'Marketing',     icon: 'campaign' },
        { value: JobCategory.WRITING,     label: 'Rédaction',     icon: 'edit_note' },
        { value: JobCategory.OTHER,       label: 'Autre',         icon: 'more_horiz' }
      ]
    },
    dropdowns: [
      {
        key: 'experienceLevel',
        label: 'Niveau',
        icon: 'trending_up',
        options: [
          { value: ExperienceLevel.BEGINNER,     label: 'Débutant' },
          { value: ExperienceLevel.INTERMEDIATE, label: 'Intermédiaire' },
          { value: ExperienceLevel.EXPERT,       label: 'Expert' }
        ]
      },
      {
        key: 'budgetType',
        label: 'Type',
        icon: 'payments',
        options: [
          { value: BudgetType.FIXED,  label: 'Forfait' },
          { value: BudgetType.HOURLY, label: 'Horaire' }
        ]
      }
    ],
    ranges: [
      {
        key: 'budget',
        minKey: 'minBudget',
        maxKey: 'maxBudget',
        label: 'Budget',
        icon: 'attach_money',
        unit: 'DT',
        step: 50,
        presets: [
          { label: '< 500',    max: 500 },
          { label: '500-2000', min: 500, max: 2000 },
          { label: '2000-5000',min: 2000, max: 5000 },
          { label: '5000+',    min: 5000 }
        ]
      }
    ],
    toggles: [
      { key: 'isRemote', label: 'Télétravail', icon: 'home_work' }
    ],
    sort: {
      key: 'sortBy',
      label: 'Trier par',
      icon: 'sort',
      options: [
        { value: 'publishedAt',    label: 'Plus récentes', icon: 'schedule' },
        { value: 'budget',         label: 'Budget le + élevé', icon: 'trending_up' },
        { value: 'applicantCount', label: 'Moins de candidats', icon: 'group' },
        { value: 'deadline',       label: 'Échéance proche', icon: 'event' }
      ]
    }
  };

  totalElements = 0;

  constructor(
    private jobOfferService: JobOfferService,
    private applicationService: ApplicationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRecommendedJobs();
    this.loadMyApplicationsThenJobs();
    this.initLiveSearch();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  // ── FilterBar hooks ──────────────────────────────────────
  onFiltersChange(next: Record<string, any>): void {
    this.filters = { ...next, page: 0, size: this.filters['size'] ?? 20 };
    this.loadJobs();
  }

  onSearchChange(q: string): void {
    this.searchSubject.next(q || '');
  }

  // ── Data loading ─────────────────────────────────────────
  private loadMyApplicationsThenJobs(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.loadJobs();
      return;
    }
    this.applicationService.getMyApplications({ freelanceId: currentUser.id }).subscribe({
      next: (apps) => {
        this.appliedJobIds = new Set(apps.map(a => a.jobOfferId));
        this.loadJobs();
      },
      error: () => this.loadJobs()
    });
  }

  initLiveSearch(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) return of([]);
        return this.jobOfferService.searchJobOffers(query, { page: 0, size: 5 });
      })
    ).subscribe({
      next: (results: any) => {
        this.searchSuggestions = Array.isArray(results) ? results.slice(0, 5) : [];
        this.showSuggestions = this.searchSuggestions.length > 0;
      },
      error: () => {
        this.searchSuggestions = [];
        this.showSuggestions = false;
      }
    });
  }

  selectSuggestion(job: JobOffer): void {
    this.showSuggestions = false;
    this.viewJobDetail(job.id);
  }

  loadRecommendedJobs(): void {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || 'anonymous';
    this.jobOfferService.getRecommendedJobOffers(userId).subscribe({
      next: (jobs: any) => { this.recommendedJobs = jobs.slice(0, 3); },
      error: (error: any) => { console.error('Error loading recommended jobs:', error); }
    });
  }

  loadJobs(): void {
    this.isLoading = true;

    const applyFilters = (jobs: any[]) => {
      let filtered = jobs;
      filtered = filtered.filter(j => j.status === 'OPEN');
      if (this.appliedJobIds.size > 0) {
        filtered = filtered.filter(j => !this.appliedJobIds.has(j.id));
      }
      const f = this.filters;
      if (f['category'])        filtered = filtered.filter(j => j.category === f['category']);
      if (f['budgetType'])      filtered = filtered.filter(j => j.budgetType === f['budgetType']);
      if (f['minBudget'] != null) filtered = filtered.filter(j => j.budget >= f['minBudget']);
      if (f['maxBudget'] != null) filtered = filtered.filter(j => j.budget <= f['maxBudget']);
      if (f['experienceLevel']) filtered = filtered.filter(j => j.experienceLevel === f['experienceLevel']);
      if (f['location']) {
        const loc = String(f['location']).toLowerCase();
        filtered = filtered.filter(j => j.location && j.location.toLowerCase().includes(loc));
      }
      if (f['isRemote']) filtered = filtered.filter(j => j.isRemote === true);

      // Client-side sort
      const sortKey = f['sortBy'];
      if (sortKey) {
        const dir = 1;
        filtered = [...filtered].sort((a, b) => {
          switch (sortKey) {
            case 'publishedAt':    return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
            case 'budget':         return (b.budget ?? 0) - (a.budget ?? 0);
            case 'applicantCount': return (a.applicantCount ?? 0) - (b.applicantCount ?? 0);
            case 'deadline':       return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            default: return 0;
          }
        });
      }
      return filtered;
    };

    const q: string = this.filters['search'] || '';
    const src$ = q
      ? this.jobOfferService.searchJobOffers(q, this.filters as JobOfferFilters)
      : this.jobOfferService.getAllJobOffers(this.filters as JobOfferFilters);

    src$.subscribe({
      next: (jobs: any) => {
        this.jobs = applyFilters(jobs);
        this.totalElements = this.jobs.length;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading jobs:', error);
        this.isLoading = false;
      }
    });
  }

  viewJobDetail(jobId: string): void {
    this.jobOfferService.incrementViewCount(jobId).subscribe();
    this.router.navigate(['/frontoffice/freelancer/jobs', jobId]);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const jobDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - jobDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7)   return `Il y a ${diffDays} jours`;
    if (diffDays < 30)  return `Il y a ${Math.floor(diffDays / 7)} sem.`;
    return jobDate.toLocaleDateString('fr-FR');
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      DEVELOPMENT: 'code',
      DESIGN: 'palette',
      MARKETING: 'campaign',
      WRITING: 'edit_note',
      OTHER: 'more_horiz'
    };
    return icons[category] || 'work_outline';
  }
}
