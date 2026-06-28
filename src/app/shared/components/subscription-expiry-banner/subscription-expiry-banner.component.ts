import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Roles } from '../../../core/constants/roles';
import { SubscriptionAccessModes } from '../../../core/constants/subscription-access';

@Component({
  selector: 'app-subscription-expiry-banner',
  standalone: true,
  template: `
    @if (message()) {
      <div class="subscription-banner" [class]="severityClass()" role="alert">
        <span>{{ message() }}</span>
        @if (showRenewAction()) {
          <button type="button" class="renew-link" (click)="goRenew()">Renew now</button>
        }
      </div>
    }
  `,
  styles: [
    `
      .subscription-banner {
        padding: 0.75rem 1.25rem;
        font-size: 0.95rem;
        border-bottom: 1px solid transparent;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .subscription-banner.info {
        background: #fff4e5;
        border-color: #ffb74d;
        color: #663c00;
      }

      .subscription-banner.warning {
        background: #fff8e1;
        border-color: #ffa000;
        color: #7a4f01;
      }

      .subscription-banner.critical {
        background: #fdecea;
        border-color: #e53935;
        color: #7f1d1d;
      }

      .renew-link {
        border: none;
        background: transparent;
        color: inherit;
        font-weight: 600;
        text-decoration: underline;
        cursor: pointer;
        white-space: nowrap;
      }
    `,
  ],
})
export class SubscriptionExpiryBannerComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly message = computed(() => this.auth.bannerMessage());
  readonly severityClass = computed(() => {
    const severity = (this.auth.bannerSeverity() ?? 'Info').toLowerCase();
    if (severity === 'critical') return 'critical';
    if (severity === 'warning') return 'warning';
    return 'info';
  });

  readonly showRenewAction = computed(
    () =>
      this.auth.hasRole(Roles.GymAdmin) &&
      (this.auth.subscriptionAccessMode() === SubscriptionAccessModes.GracePeriod ||
        (this.auth.daysToExpiry() !== null && this.auth.daysToExpiry()! <= 7))
  );

  goRenew(): void {
    this.router.navigate(['/gym-admin/renew-subscription']);
  }
}
