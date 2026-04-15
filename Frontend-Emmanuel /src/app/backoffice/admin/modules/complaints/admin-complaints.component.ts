import {
  Component, OnInit, OnDestroy, signal, computed, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SearchHighlightPipe } from './search-highlight.pipe';
import { ComplaintService } from '@core/services/complaint.service';
import {
  Complaint, ComplaintStatus, ComplaintPriority, ComplaintCategory,
  STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, CATEGORY_LABELS
} from '@core/models/complaint.model';

@Component({
  selector: 'app-admin-complaints',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatSnackBarModule, SearchHighlightPipe],
  templateUrl: './admin-complaints.component.html',
  styleUrls: ['./admin-complaints.component.scss']
})
export class AdminComplaintsComponent implements OnInit, OnDestroy {

  // ── Données ───────────────────────────────────────────────
  complaints        = signal<Complaint[]>([]);
  adminQueue        = signal<Complaint[]>([]);
  overdueComplaints = signal<Complaint[]>([]);
  activeView        = signal<'queue' | 'all' | 'overdue'>('queue');
  isLoading         = signal(true);
  isLoadingOverdue  = signal(false);

  // ── Filtres ───────────────────────────────────────────────
  filterStatus   = signal<string>('all');
  filterPriority = signal<string>('all');
  filterCategory = signal<string>('all');

  // ── Recherche avec debounce ───────────────────────────────
  /** Valeur brute liée à l'input ([(ngModel)]) */
  searchInput    = '';
  /** Valeur effective après debounce — utilisée par computed() */
  searchQuery    = signal<string>('');
  /** Spinner actif entre frappe et application du debounce */
  isSearching    = signal(false);

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  // ── Options statiques ──────────────────────────────────────
  statuses   = Object.values(ComplaintStatus);
  priorities = Object.values(ComplaintPriority);
  categories = Object.values(ComplaintCategory);

  // ── Computed : liste filtrée ───────────────────────────────
  filtered = computed(() => {
    let list = this.complaints();

    const status   = this.filterStatus();
    const priority = this.filterPriority();
    const category = this.filterCategory();
    const search   = this.searchQuery().toLowerCase().trim();

    if (status   !== 'all') list = list.filter(c => c.status   === status);
    if (priority !== 'all') list = list.filter(c => c.priority === priority);
    if (category !== 'all') list = list.filter(c => c.category === category);

    if (search) {
      list = list.filter(c =>
        c.subject.toLowerCase().includes(search)      ||
        c.ticketNumber.toLowerCase().includes(search) ||
        c.reporterId.toLowerCase().includes(search)   ||
        c.description.toLowerCase().includes(search)  ||
        (c.category as string).toLowerCase().includes(search)
      );
    }

    return list;
  });

  // ── Indicateur filtres actifs ──────────────────────────────
  hasActiveFilters = computed(() =>
    this.filterStatus()   !== 'all' ||
    this.filterPriority() !== 'all' ||
    this.filterCategory() !== 'all' ||
    this.searchQuery()    !== ''
  );

  constructor(
    private complaintService: ComplaintService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadQueue();
    this.load();
    this.initSearchDebounce();
  }

  loadQueue(): void {
    this.complaintService.getAdminQueue().subscribe({
      next: data => this.adminQueue.set(data),
      error: () => {}
    });
  }

  loadOverdue(): void {
    this.isLoadingOverdue.set(true);
    this.complaintService.getOverdueComplaints(7).subscribe({
      next: data => { this.overdueComplaints.set(data); this.isLoadingOverdue.set(false); },
      error: () => {
        this.snackBar.open('Erreur chargement réclamations en retard', 'Fermer', { duration: 3000 });
        this.isLoadingOverdue.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  // ── Debounce ──────────────────────────────────────────────

  private initSearchDebounce(): void {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchQuery.set(value);   // applique la valeur — computed se recalcule
      this.isSearching.set(false);   // spinner OFF
    });
  }

  /** Appelé à chaque frappe dans l'input */
  onSearchChange(value: string): void {
    this.searchInput = value;

    if (value.trim() === '' && this.searchQuery() === '') {
      // Champ déjà vide → rien à faire
      this.isSearching.set(false);
      return;
    }

    this.isSearching.set(true);    // spinner ON dès la première frappe
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchInput = '';
    this.isSearching.set(false);
    this.searchQuery.set('');
    this.searchSubject.next('');
  }

  // ── Chargement ────────────────────────────────────────────

  load(): void {
    this.isLoading.set(true);
    this.complaintService.getAllComplaints().subscribe({
      next: data => { this.complaints.set(data); this.isLoading.set(false); },
      error: () => {
        this.snackBar.open('Erreur de chargement', 'Fermer', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  resetFilters(): void {
    this.filterStatus.set('all');
    this.filterPriority.set('all');
    this.filterCategory.set('all');
    this.clearSearch();
  }

  // ── Navigation ────────────────────────────────────────────

  viewDetail(id: string): void {
    this.router.navigate(['/backoffice/admin/complaints', id]);
  }

  goToStats(): void {
    this.router.navigate(['/backoffice/admin/complaints/stats']);
  }

  // ── Helpers affichage ─────────────────────────────────────

  countByStatus(status: string): number {
    return this.complaints().filter(c => c.status === (status as ComplaintStatus)).length;
  }

  getStatusLabel   = (s: any) => (STATUS_LABELS   as Record<string, string>)[s] || s;
  getStatusColor   = (s: any) => (STATUS_COLORS   as Record<string, string>)[s] || '#999';
  getPriorityLabel = (p: any) => (PRIORITY_LABELS as Record<string, string>)[p] || p;
  getPriorityColor = (p: any) => (PRIORITY_COLORS as Record<string, string>)[p] || '#999';
  getCategoryLabel = (c: any) => (CATEGORY_LABELS as Record<string, string>)[c] || c;

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}