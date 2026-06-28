import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { LeadService } from '../../../core/services/lead.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Permissions } from '../../../core/constants/permissions';
import {
  KANBAN_STATUSES,
  LEAD_SOURCES,
  LEAD_STATUS_LABELS,
  Lead,
  LeadDashboard,
} from '../../../shared/models/lead.models';
import { SaasKpiCardComponent } from '../../../shared/components/saas-kpi-card/saas-kpi-card.component';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    ReactiveFormsModule,
    RouterModule,
    DragDropModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    SaasKpiCardComponent,
  ],
  templateUrl: './lead-list.component.html',
  styleUrl: './lead-list.component.css',
})
export class LeadListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leadService = inject(LeadService);
  private readonly notify = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;

  readonly statuses = KANBAN_STATUSES;
  readonly sources = LEAD_SOURCES;
  readonly displayedColumns = ['fullName', 'mobileNumber', 'leadSource', 'status', 'trainer', 'createdDate', 'actions'];
  readonly kanbanDropIds = KANBAN_STATUSES.map((_, i) => `kanban-${i}`);

  searchControl = this.fb.nonNullable.control('');
  statusControl = this.fb.nonNullable.control('');
  sourceControl = this.fb.nonNullable.control('');

  dataSource = new MatTableDataSource<Lead>([]);
  loading = signal(true);
  dashboardLoading = signal(true);
  dashboard = signal<LeadDashboard | null>(null);
  totalCount = signal(0);
  viewMode = signal<'list' | 'kanban'>('list');
  pageIndex = 0;
  pageSize = 10;

  kanbanColumns = KANBAN_STATUSES.map((status, i) => ({
    status,
    dropId: `kanban-${i}`,
    leads: [] as Lead[],
  }));

  get pageSummary(): string {
    const total = this.totalCount();
    if (!total) return 'No leads';
    const start = this.pageIndex * this.pageSize + 1;
    const end = Math.min((this.pageIndex + 1) * this.pageSize, total);
    return `Showing ${start}–${end} of ${total} leads`;
  }

  ngOnInit(): void {
    this.loadDashboard();
    this.load();
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.load();
    });
    this.statusControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.load();
    });
    this.sourceControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.load();
    });
  }

  statusLabel(status: string): string {
    return LEAD_STATUS_LABELS[status] ?? status;
  }

  sourceLabel(source: string): string {
    return source.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  conversionRateLabel(): string {
    const rate = this.dashboard()?.conversionRate ?? 0;
    return `${rate}%`;
  }

  convertedHint(): string {
    const count = this.dashboard()?.convertedLeads ?? 0;
    return count ? `${count} converted` : 'No conversions yet';
  }

  kanbanTotal(): number {
    return this.kanbanColumns.reduce((sum, col) => sum + col.leads.length, 0);
  }

  kanbanColumnClass(status: string): string {
    switch (status) {
      case 'New':
        return 'kanban-column--new';
      case 'Contacted':
        return 'kanban-column--contact';
      case 'TrialScheduled':
        return 'kanban-column--trial';
      case 'FollowUpPending':
        return 'kanban-column--followup';
      case 'Converted':
        return 'kanban-column--converted';
      case 'Lost':
        return 'kanban-column--lost';
      default:
        return '';
    }
  }

  avatarToneClass(status: string): string {
    switch (status) {
      case 'New':
        return 'avatar-tone--new';
      case 'Contacted':
        return 'avatar-tone--contact';
      case 'TrialScheduled':
      case 'TrialCompleted':
        return 'avatar-tone--trial';
      case 'FollowUpPending':
        return 'avatar-tone--followup';
      case 'Converted':
        return 'avatar-tone--converted';
      case 'Lost':
        return 'avatar-tone--lost';
      default:
        return '';
    }
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'New':
        return 'status-badge--new';
      case 'Contacted':
        return 'status-badge--contact';
      case 'TrialScheduled':
      case 'TrialCompleted':
        return 'status-badge--trial';
      case 'FollowUpPending':
        return 'status-badge--followup';
      case 'Converted':
        return 'status-badge--converted';
      case 'Lost':
        return 'status-badge--lost';
      default:
        return 'status-badge--muted';
    }
  }

  leadInitials(name: string): string {
    return (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  loadDashboard(): void {
    this.dashboardLoading.set(true);
    this.leadService.getDashboard().subscribe({
      next: (res) => {
        this.dashboard.set(res.data ?? null);
        this.dashboardLoading.set(false);
      },
      error: () => this.dashboardLoading.set(false),
    });
  }

  load(): void {
    this.loading.set(true);
    this.leadService
      .getPaged({
        search: this.searchControl.value || undefined,
        status: this.statusControl.value || undefined,
        leadSource: this.sourceControl.value || undefined,
        pageNumber: this.pageIndex + 1,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          const items = res.data?.items ?? [];
          this.dataSource.data = items;
          this.totalCount.set(res.data?.totalCount ?? 0);
          this.refreshKanban(items);
          this.loading.set(false);
        },
        error: (err) => {
          this.notify.error(err?.error?.message ?? 'Failed to load leads');
          this.loading.set(false);
        },
      });

    if (!this.auth.hasPermission(Permissions.ManageLeads)) return;
    this.leadService
      .getAll({
        search: this.searchControl.value || undefined,
        status: this.statusControl.value || undefined,
        leadSource: this.sourceControl.value || undefined,
      })
      .subscribe({
        next: (items) => this.refreshKanban(items),
      });
  }

  refreshKanban(leads: Lead[]): void {
    for (const col of this.kanbanColumns) {
      col.leads = leads.filter((l) => l.status === col.status);
    }
  }

  onDrop(event: CdkDragDrop<Lead[]>, targetStatus: string): void {
    if (!this.auth.hasPermission(Permissions.ManageLeads)) return;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const lead = event.previousContainer.data[event.previousIndex];
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.leadService.updateStatus(lead.id, targetStatus).subscribe({
      error: () => {
        this.notify.error('Failed to update lead status');
        this.load();
      },
    });
  }
}
