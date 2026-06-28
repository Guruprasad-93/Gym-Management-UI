import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  catalogPlansForPurchase,
  lowestPrice,
  resolveCheckoutAction,
  topFeatures,
} from './plan-catalog.utils';

@Component({
  selector: 'app-plan-catalog',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './plan-catalog.component.html',
  styleUrl: './subscription.shared.css',
})
export class PlanCatalogComponent implements OnInit {
  private readonly saas = inject(SaasSubscriptionService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;

  loading = signal(true);
  plans = signal<SaasPlanCatalogItem[]>([]);
  subscription = signal<GymSubscription | null>(null);
  selectedForCompare = signal<Set<number>>(new Set());

  readonly durationLabel = durationLabel;
  readonly lowestPrice = lowestPrice;
  readonly topFeatures = topFeatures;

  ngOnInit(): void {
    this.saas.getPlanCatalog().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data?.plans) {
          this.plans.set(catalogPlansForPurchase(res.data.plans));
        }
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load plan catalog');
      },
    });

    this.saas.getSubscription().subscribe({
      next: (res) => {
        if (res.success && res.data) this.subscription.set(res.data);
      },
    });
  }

  isCurrentPlan(plan: SaasPlanCatalogItem): boolean {
    return this.subscription()?.saasPlanId === plan.id;
  }

  canCheckout(): boolean {
    return this.auth.hasPermission(Permissions.ManageSaasSubscription);
  }

  checkout(plan: SaasPlanCatalogItem, pricingOptionId: number): void {
    const action = resolveCheckoutAction(this.subscription(), plan.id);
    this.router.navigate(['/gym-admin/subscription/checkout'], {
      queryParams: { planId: plan.id, pricingOptionId, action },
    });
  }

  toggleCompare(planId: number, checked: boolean): void {
    const next = new Set(this.selectedForCompare());
    if (checked) {
      next.add(planId);
    } else {
      next.delete(planId);
    }
    this.selectedForCompare.set(next);
  }

  openCompare(): void {
    const ids = [...this.selectedForCompare()];
    if (ids.length < 2) {
      this.notify.error('Select at least two plans to compare');
      return;
    }
    this.router.navigate(['/gym-admin/subscription/compare'], {
      queryParams: { plans: ids.join(',') },
    });
  }
}
