import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';
import { SUBSCRIPTION_EXPIRED_MESSAGE } from '../../core/constants/subscription-access';

@Component({
  selector: 'app-subscription-expired',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  template: `
    <div class="expired-page">
      <mat-card class="expired-card">
        <mat-card-header>
          <mat-card-title>Subscription Expired</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>{{ message }}</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-stroked-button type="button" (click)="logout()">Sign out</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .expired-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: #f5f7fb;
      }

      .expired-card {
        max-width: 520px;
        width: 100%;
      }

      p {
        margin: 0;
        line-height: 1.6;
      }
    `,
  ],
})
export class SubscriptionExpiredComponent {
  private readonly auth = inject(AuthService);

  readonly message = SUBSCRIPTION_EXPIRED_MESSAGE;

  logout(): void {
    this.auth.logout();
  }
}
