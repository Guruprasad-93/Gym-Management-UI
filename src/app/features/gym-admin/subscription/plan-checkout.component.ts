import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { SaasSubscriptionService } from '../../../core/services/saas-subscription.service';
import { NotificationService } from '../../../core/services/notification.service';
import { durationLabel, PlanPricingOption, SaasPlanCatalogItem } from '../../../shared/models/plan.models';
import { GymSubscription } from '../../../shared/models/saas.models';
import {
  catalogPlansForPurchase,
  checkoutActionLabel,
  CheckoutAction,
  resolveCheckoutAction,
} from './plan-catalog.utils';
import { SubscriptionCheckoutService } from './subscription-checkout.service';

@Component({
  selector: 'app-plan-checkout',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './plan-checkout.component.html',
  styleUrl: './subscription.shared.css',
})
export class PlanCheckoutComponent implements OnInit {
  private readonly saas = inject(SaasSubscriptionService);
  private readonly checkout = inject(SubscriptionCheckoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  loading = signal(true);
  paying = signal(false);
  subscription = signal<GymSubscription | null>(null);
  plan = signal<SaasPlanCatalogItem | null>(null);
  pricingOption = signal<PlanPricingOption | null>(null);
  action = signal<CheckoutAction>('purchase');

  readonly durationLabel = durationLabel;
  readonly checkoutActionLabel = checkoutActionLabel;

  ngOnInit(): void {
    const planId = Number(this.route.snapshot.queryParamMap.get('planId'));
    const pricingOptionId = Number(this.route.snapshot.queryParamMap.get('pricingOptionId'));
    const actionParam = (this.route.snapshot.queryParamMap.get('action') ?? 'purchase') as CheckoutAction;

    if (!planId) {
      this.loading.set(false);
      this.notify.error('Plan not specified');
      return;
    }

    forkJoin({
      catalog: this.saas.getPlanCatalog(),
      subscription: this.saas.getSubscription(),
    }).subscribe({
      next: ({ catalog, subscription }) => {
        this.loading.set(false);

        if (subscription.success && subscription.data) {
          this.subscription.set(subscription.data);
        }

        const plans = catalog.success && catalog.data?.plans
          ? catalogPlansForPurchase(catalog.data.plans)
          : [];
        const selectedPlan = plans.find((p) => p.id === planId) ?? null;
        this.plan.set(selectedPlan);

        if (!selectedPlan) {
          this.notify.error('Plan not found in catalog');
          return;
        }

        const resolvedAction =
          actionParam === 'purchase' || actionParam === 'upgrade' || actionParam === 'renew'
            ? actionParam
            : resolveCheckoutAction(subscription.data ?? null, planId);
        this.action.set(resolvedAction);

        if (pricingOptionId) {
          const option =
            selectedPlan.pricingOptions.find((p) => p.pricingOptionId === pricingOptionId) ?? null;
          this.pricingOption.set(option);
          if (!option) this.notify.error('Pricing option not found');
        }
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load checkout details');
      },
    });
  }

  selectPricingOption(option: PlanPricingOption): void {
    this.pricingOption.set(option);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pricingOptionId: option.pricingOptionId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  pay(): void {
    const plan = this.plan();
    const option = this.pricingOption();
    if (!plan || !option) {
      this.notify.error('Select a pricing option');
      return;
    }

    this.paying.set(true);
    this.checkout.startCheckout(plan.id, option.pricingOptionId, this.action()).subscribe({
      next: () => {
        this.paying.set(false);
        this.router.navigate(['/gym-admin/subscription/overview']);
      },
      error: (err) => {
        this.paying.set(false);
        const message = err?.error?.message ?? err?.message ?? 'Payment failed';
        if (message !== 'Payment cancelled') {
          this.notify.error(message);
        }
      },
    });
  }
}
