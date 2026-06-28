import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SaasSubscriptionService } from '../../../core/services/saas-subscription.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Permissions } from '../../../core/constants/permissions';
import { durationLabel, SaasPlanCatalogItem } from '../../../shared/models/plan.models';
import { GymSubscription } from '../../../shared/models/saas.models';
import {
  buildFeatureComparisonRows,
  buildQuotaComparisonRows,
  catalogPlansForPurchase,
  planHasFeature,
  resolveCheckoutAction,
} from './plan-catalog.utils';

@Component({
  selector: 'app-plan-compare',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './plan-compare.component.html',
  styleUrl: './subscription.shared.css',
})
export class PlanCompareComponent implements OnInit {
  private readonly saas = inject(SaasSubscriptionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;

  loading = signal(true);
  allPlans = signal<SaasPlanCatalogItem[]>([]);
  selectedPlans = signal<SaasPlanCatalogItem[]>([]);
  subscription = signal<GymSubscription | null>(null);

  featureRows = signal<ReturnType<typeof buildFeatureComparisonRows>>([]);
  quotaRows = signal<ReturnType<typeof buildQuotaComparisonRows>>([]);
  categories = signal<string[]>([]);

  readonly durationLabel = durationLabel;
  readonly planHasFeature = planHasFeature;

  ngOnInit(): void {
    const planIdsParam = this.route.snapshot.queryParamMap.get('plans');
    const initialIds = planIdsParam
      ? planIdsParam.split(',').map((v) => Number(v)).filter((v) => !Number.isNaN(v))
      : [];

    this.saas.getSubscription().subscribe({
      next: (res) => {
        if (res.success && res.data) this.subscription.set(res.data);
      },
    });

    this.saas.getPlanCatalog().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (!res.success || !res.data?.plans) return;

        const plans = catalogPlansForPurchase(res.data.plans);
        this.allPlans.set(plans);

        const selected = initialIds.length
          ? plans.filter((p) => initialIds.includes(p.id))
          : plans.slice(0, Math.min(3, plans.length));

        this.applySelection(selected);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load plans for comparison');
      },
    });
  }

  isSelected(planId: number): boolean {
    return this.selectedPlans().some((p) => p.id === planId);
  }

  togglePlan(planId: number, checked: boolean): void {
    const plans = this.allPlans();
    let selected = [...this.selectedPlans()];

    if (checked) {
      const plan = plans.find((p) => p.id === planId);
      if (plan && !selected.some((p) => p.id === planId)) selected.push(plan);
    } else {
      selected = selected.filter((p) => p.id !== planId);
    }

    this.applySelection(selected);
  }

  checkout(plan: SaasPlanCatalogItem, pricingOptionId: number): void {
    const action = resolveCheckoutAction(this.subscription(), plan.id);
    this.router.navigate(['/gym-admin/subscription/checkout'], {
      queryParams: { planId: plan.id, pricingOptionId, action },
    });
  }

  isCurrentPlan(plan: SaasPlanCatalogItem): boolean {
    return this.subscription()?.saasPlanId === plan.id;
  }

  private applySelection(selected: SaasPlanCatalogItem[]): void {
    const sorted = [...selected].sort((a, b) => a.sortOrder - b.sortOrder);
    this.selectedPlans.set(sorted);
    this.featureRows.set(buildFeatureComparisonRows(sorted));
    this.quotaRows.set(buildQuotaComparisonRows(sorted));
    this.categories.set([...new Set(this.featureRows().map((r) => r.category))].sort());

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { plans: sorted.map((p) => p.id).join(',') },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  featuresInCategory(category: string) {
    return this.featureRows().filter((r) => r.category === category);
  }
}
