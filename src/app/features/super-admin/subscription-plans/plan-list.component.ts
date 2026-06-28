import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { PlanManagementService } from '../../../core/services/plan-management.service';
import { DialogService } from '../../../core/services/dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ClonePlanRequest, DynamicPlan, PlanSummary } from '../../../shared/models/plan.models';
import { PlanCloneDialogComponent } from './plan-clone-dialog.component';

@Component({
  selector: 'app-subscription-plan-list',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './plan-list.component.html',
  styleUrls: ['./subscription-plans.shared.css', './plan-list.component.css'],
})
export class SubscriptionPlanListComponent implements OnInit {
  private readonly planService = inject(PlanManagementService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(DialogService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = [
    'planName',
    'status',
    'activeSubscriberCount',
    'featureCount',
    'pricingOptionCount',
    'isTrialPlan',
    'createdAt',
    'actions',
  ];

  dataSource = new MatTableDataSource<PlanSummary>([]);
  searchControl = this.fb.nonNullable.control('');
  statusControl = this.fb.nonNullable.control<'all' | 'active' | 'inactive'>('all');
  loading = false;

  get pageSummary(): string {
    const total = this.dataSource.filteredData.length;
    if (!total || !this.paginator) return total ? `${total} plans` : 'No plans';
    const start = this.paginator.pageIndex * this.paginator.pageSize + 1;
    const end = Math.min((this.paginator.pageIndex + 1) * this.paginator.pageSize, total);
    return `Showing ${start}-${end} of ${total} plans`;
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data, filter) => {
      const parsed = JSON.parse(filter) as { text: string; status: 'all' | 'active' | 'inactive' };
      const haystack = `${data.planName} ${data.planCode}`.toLowerCase();
      const matchesText = !parsed.text || haystack.includes(parsed.text);
      const matchesStatus =
        parsed.status === 'all' ||
        (parsed.status === 'active' && data.isActive) ||
        (parsed.status === 'inactive' && !data.isActive);
      return matchesText && matchesStatus;
    };

    this.searchControl.valueChanges.subscribe(() => this.applyFilter());
    this.statusControl.valueChanges.subscribe(() => this.applyFilter());
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading = true;
    this.planService.getPlans().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.dataSource.data = res.data;
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.paginator?.page.subscribe(() => this.cdr.markForCheck());
          });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notify.error('Failed to load subscription plans');
      },
    });
  }

  viewPlan(plan: PlanSummary): void {
    this.router.navigate(['/super-admin/subscription-plans', plan.id]);
  }

  editPlan(plan: PlanSummary): void {
    this.router.navigate(['/super-admin/subscription-plans', plan.id, 'edit']);
  }

  createPlan(): void {
    this.router.navigate(['/super-admin/subscription-plans/new']);
  }

  clonePlan(plan: PlanSummary): void {
    const ref = this.dialog.open(PlanCloneDialogComponent, {
      width: '480px',
      data: { plan },
    });

    ref.afterClosed().subscribe((dto) => {
      if (!dto) return;
      this.planService.clonePlan(plan.id, dto as ClonePlanRequest).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.notify.success('Plan cloned');
            this.router.navigate(['/super-admin/subscription-plans', res.data.id, 'edit']);
          }
        },
        error: (err) => this.notify.error(err.error?.message ?? 'Clone failed'),
      });
    });
  }

  toggleActive(plan: PlanSummary): void {
    const nextActive = !plan.isActive;
    const action = nextActive ? 'activate' : 'deactivate';

    this.dialog
      .confirm({
        title: nextActive ? 'Activate plan' : 'Deactivate plan',
        message: `${nextActive ? 'Activate' : 'Deactivate'} "${plan.planName}"?`,
        tone: nextActive ? 'default' : 'danger',
        confirmLabel: nextActive ? 'Activate' : 'Deactivate',
      })
      .subscribe((ok) => {
        if (!ok) return;

        this.planService.getPlan(plan.id).subscribe({
          next: (res) => {
            if (!res.success || !res.data) return;
            const detail = res.data;
            this.planService
              .updatePlan(plan.id, this.toUpdateRequest(detail, nextActive))
              .subscribe({
                next: (updateRes) => {
                  if (updateRes.success) {
                    this.notify.success(`Plan ${action}d`);
                    this.loadPlans();
                  }
                },
                error: (err) => this.notify.error(err.error?.message ?? `${action} failed`),
              });
          },
          error: () => this.notify.error('Failed to load plan details'),
        });
      });
  }

  private toUpdateRequest(plan: DynamicPlan, isActive: boolean) {
    return {
      planCode: plan.planCode,
      planName: plan.planName,
      description: plan.description,
      isTrialPlan: plan.isTrialPlan,
      isPublic: plan.isPublic,
      trialDays: plan.trialDays,
      sortOrder: plan.sortOrder,
      isActive,
      quotas: plan.quotas
        ? {
            maxMembers: plan.quotas.maxMembers,
            maxTrainers: plan.quotas.maxTrainers,
            maxBranches: plan.quotas.maxBranches,
            maxStorageGB: plan.quotas.maxStorageGB,
            maxSmsPerMonth: plan.quotas.maxSmsPerMonth,
            maxWhatsappMessages: plan.quotas.maxWhatsappMessages,
          }
        : undefined,
      featureIds: plan.features.filter((f) => f.isIncluded).map((f) => f.featureId),
    };
  }

  private applyFilter(): void {
    this.dataSource.filter = JSON.stringify({
      text: this.searchControl.value.trim().toLowerCase(),
      status: this.statusControl.value,
    });
    this.paginator?.firstPage();
    this.cdr.markForCheck();
  }

  onPageChange(): void {
    this.cdr.markForCheck();
  }
}
