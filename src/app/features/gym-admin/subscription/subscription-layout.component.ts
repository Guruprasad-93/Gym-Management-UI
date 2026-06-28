import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { Permissions } from '../../../core/constants/permissions';

@Component({
  selector: 'app-subscription-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="member-page subscription-layout">
      <header class="saas-page__header">
        <div>
          <h1 class="saas-page__title">Subscription</h1>
          <p class="saas-page__subtitle">Manage your plan, billing, and entitled features</p>
        </div>
      </header>

      <nav class="subscription-nav" aria-label="Subscription sections">
        <a class="subscription-nav__link" routerLink="/gym-admin/subscription/overview" routerLinkActive="subscription-nav__link--active">
          <mat-icon>dashboard</mat-icon>
          Overview
        </a>
        <a class="subscription-nav__link" routerLink="/gym-admin/subscription/catalog" routerLinkActive="subscription-nav__link--active">
          <mat-icon>storefront</mat-icon>
          Plan Catalog
        </a>
        <a class="subscription-nav__link" routerLink="/gym-admin/subscription/compare" routerLinkActive="subscription-nav__link--active">
          <mat-icon>compare</mat-icon>
          Compare
        </a>
        <a class="subscription-nav__link" routerLink="/gym-admin/subscription/my-features" routerLinkActive="subscription-nav__link--active">
          <mat-icon>extension</mat-icon>
          My Features
        </a>
      </nav>

      <router-outlet />
    </div>
  `,
  styleUrl: './subscription.shared.css',
})
export class SubscriptionLayoutComponent {
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;
}
