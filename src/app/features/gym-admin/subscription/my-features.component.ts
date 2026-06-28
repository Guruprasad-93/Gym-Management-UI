import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SaasSubscriptionService } from '../../../core/services/saas-subscription.service';
import { NotificationService } from '../../../core/services/notification.service';
import { GymFeatures } from '../../../shared/models/plan.models';

@Component({
  selector: 'app-my-features',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './my-features.component.html',
  styleUrl: './subscription.shared.css',
})
export class MyFeaturesComponent implements OnInit {
  private readonly saas = inject(SaasSubscriptionService);
  private readonly notify = inject(NotificationService);

  loading = signal(true);
  features = signal<GymFeatures | null>(null);

  ngOnInit(): void {
    this.saas.getMyFeatures().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.features.set(res.data);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load features');
      },
    });
  }
}
