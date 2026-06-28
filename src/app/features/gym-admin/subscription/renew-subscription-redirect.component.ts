import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SaasSubscriptionService } from '../../../core/services/saas-subscription.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-renew-subscription-redirect',
  standalone: true,
  template: `<p style="padding: 1rem; color: #667085">Redirecting to renewal checkout…</p>`,
})
export class RenewSubscriptionRedirectComponent implements OnInit {
  private readonly saas = inject(SaasSubscriptionService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  ngOnInit(): void {
    this.saas.getSubscription().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.router.navigate(['/gym-admin/subscription/checkout'], {
            queryParams: {
              action: 'renew',
              planId: res.data.saasPlanId,
              pricingOptionId: res.data.pricingOptionId ?? undefined,
            },
          });
          return;
        }
        this.notify.error('No subscription found for renewal');
        this.router.navigate(['/gym-admin/subscription/catalog']);
      },
      error: () => {
        this.notify.error('Failed to load subscription');
        this.router.navigate(['/gym-admin/subscription/catalog']);
      },
    });
  }
}
