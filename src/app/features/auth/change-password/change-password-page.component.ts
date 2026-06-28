import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PasswordFieldComponent } from '../../../shared/components/password-field/password-field.component';
import {
  PASSWORD_MISMATCH_MESSAGE,
  confirmPasswordValidator,
} from '../../../shared/validators/password.validators';

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    PasswordFieldComponent,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-title>Change Password</mat-card-title>
        <mat-card-subtitle>
          @if (auth.mustChangePassword()) {
            You must set a new password before continuing.
          } @else {
            Update your account password.
          }
        </mat-card-subtitle>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <app-password-field
              label="Current Password"
              [control]="form.controls.currentPassword"
              autocomplete="current-password"
            />
            <app-password-field
              label="New Password"
              [control]="form.controls.newPassword"
              autocomplete="new-password"
              minLengthMessage="Minimum 8 characters"
            />
            <app-password-field
              label="Confirm New Password"
              [control]="form.controls.confirmPassword"
              autocomplete="new-password"
              [mismatchMessage]="mismatchMessage"
            />
            <button mat-flat-button color="primary" class="full-width submit-btn" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="22" />
              } @else {
                Update Password
              }
            </button>
          </form>
        </mat-card-content>
        @if (!auth.mustChangePassword()) {
          <mat-card-actions>
            <a mat-button routerLink="/auth/login">Back to login</a>
          </mat-card-actions>
        }
      </mat-card>
    </div>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
        padding: 1rem;
      }
      .auth-card {
        width: 100%;
        max-width: 420px;
        padding: 1rem;
      }
      .full-width {
        width: 100%;
        display: block;
      }
      .submit-btn {
        margin-top: 0.5rem;
        height: 48px;
      }
    `,
  ],
})
export class ChangePasswordPageComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly mismatchMessage = PASSWORD_MISMATCH_MESSAGE;
  loading = false;
  private subs = new Subscription();

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, confirmPasswordValidator('newPassword')]],
  });

  ngOnInit(): void {
    this.subs.add(
      this.form.controls.newPassword.valueChanges.subscribe(() =>
        this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false })
      )
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    this.loading = true;
    this.auth.changePassword({ currentPassword, newPassword, confirmPassword }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.notify.success('Password updated. Please sign in again.');
          this.auth.clearSession();
          this.router.navigate(['/auth/login']);
        } else {
          this.notify.error(res.message ?? 'Password change failed');
        }
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err.error?.message ?? 'Password change failed');
      },
    });
  }
}
