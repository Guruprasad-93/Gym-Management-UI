import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SaasKpiCardComponent } from '../../../shared/components/saas-kpi-card/saas-kpi-card.component';
import { SaasSubscriptionService } from '../../../core/services/saas-subscription.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Permissions } from '../../../core/constants/permissions';
import { GymSubscription, GymUsage } from '../../../shared/models/saas.models';

@Component({
  selector: 'app-subscription-overview',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
    SaasKpiCardComponent,
  ],
  templateUrl: './subscription-overview.component.html',
  styleUrl: './subscription.shared.css',
})
export class SubscriptionOverviewComponent implements OnInit {
  private readonly saas = inject(SaasSubscriptionService);
  private readonly notify = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;

  loading = signal(true);
  subscription = signal<GymSubscription | null>(null);
  usage = signal<GymUsage | null>(null);

  ngOnInit(): void {
    this.saas.getSubscription().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.subscription.set(res.data);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load subscription');
      },
    });

    this.saas.getUsage().subscribe({
      next: (res) => {
        if (res.success && res.data) this.usage.set(res.data);
      },
    });
  }

  statusBannerClass(sub: GymSubscription): string {
    const severity = (sub.bannerSeverity ?? '').toLowerCase();
    if (severity === 'danger' || severity === 'error') return 'status-banner--danger';
    if (severity === 'warning') return 'status-banner--warning';
    if (severity === 'success') return 'status-banner--success';
    if (!sub.hasAccess) return 'status-banner--danger';
    if ((sub.graceDaysRemaining ?? 0) > 0) return 'status-banner--warning';
    return 'status-banner--info';
  }

  cancel(): void {
    this.saas.cancel(true).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.subscription.set(res.data);
          this.notify.success('Subscription will cancel at period end');
        }
      },
      error: () => this.notify.error('Cancel failed'),
    });
  }
}
