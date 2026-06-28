import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Roles } from '../../../core/constants/roles';

@Component({
  selector: 'app-subscription-expiry-popup',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    @if (open()) {
      <div class="popup-backdrop" role="dialog" aria-modal="true">
        <div class="popup-card">
          <h2>Subscription Reminder</h2>
          <p>{{ message() }}</p>
          <div class="actions">
            @if (auth.hasRole(Roles.GymAdmin)) {
              <button mat-flat-button color="primary" type="button" (click)="renew()">Renew now</button>
            }
            <button mat-stroked-button type="button" (click)="dismiss()">Dismiss</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .popup-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(16, 24, 40, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1200;
        padding: 1rem;
      }

      .popup-card {
        background: #fff;
        border-radius: 12px;
        padding: 1.5rem;
        max-width: 480px;
        width: 100%;
        box-shadow: 0 20px 40px rgba(16, 24, 40, 0.18);
      }

      h2 {
        margin: 0 0 0.75rem;
      }

      p {
        margin: 0 0 1.25rem;
        line-height: 1.5;
      }

      .actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }
    `,
  ],
})
export class SubscriptionExpiryPopupComponent {
  readonly auth = inject(AuthService);
  readonly Roles = Roles;
  private readonly router = inject(Router);

  readonly open = input(false);
  readonly message = input('');
  readonly dismissed = output<void>();

  renew(): void {
    this.dismissed.emit();
    this.router.navigate(['/gym-admin/renew-subscription']);
  }

  dismiss(): void {
    this.dismissed.emit();
  }
}
