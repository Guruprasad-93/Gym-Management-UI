import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { SubscriptionAccessModes } from '../../../core/constants/subscription-access';

@Component({
  selector: 'app-subscription-grace-banner',
  standalone: true,
  template: `
    @if (showBanner()) {
      <div class="grace-banner" role="alert">
        <strong>Subscription expiring soon.</strong>
        Your gym subscription grace period ends
        @if (daysRemaining() !== null) {
          in {{ daysRemaining() }} day{{ daysRemaining() === 1 ? '' : 's' }}.
        } @else {
          soon.
        }
        Please renew to avoid service interruption.
      </div>
    }
  `,
  styles: [
    `
      .grace-banner {
        background: #fff4e5;
        border-bottom: 1px solid #ffb74d;
        color: #663c00;
        padding: 0.75rem 1.25rem;
        font-size: 0.95rem;
      }
    `,
  ],
})
export class SubscriptionGraceBannerComponent {
  private readonly auth = inject(AuthService);

  readonly showBanner = computed(
    () => this.auth.subscriptionAccessMode() === SubscriptionAccessModes.GracePeriod
  );

  readonly daysRemaining = computed(() => this.auth.graceDaysRemaining());
}
