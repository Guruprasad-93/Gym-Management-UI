import { NgStyle } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { BrandingService } from '../../../core/services/branding.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [
    NgStyle,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-page" [ngStyle]="pageBackgroundStyle">
      <mat-card class="auth-card">
        <mat-card-header>
          <div mat-card-avatar class="avatar-wrap" [class.avatar-wrap--success]="sent()">
            @if (sent()) {
              <mat-icon>mark_email_read</mat-icon>
            } @else if (branding.logoUrl()) {
              <img [src]="branding.logoUrl()!" alt="Logo" class="brand-logo" />
            } @else {
              <mat-icon>lock_reset</mat-icon>
            }
          </div>
          <mat-card-title>{{ sent() ? 'Check your email' : 'Forgot password?' }}</mat-card-title>
          <mat-card-subtitle>
            @if (sent()) {
              If an account exists for that address, reset instructions are on the way.
            } @else {
              Enter your email and we'll send you a link to reset your password.
            }
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (!sent()) {
            <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Login ID</mat-label>
                <mat-icon matPrefix>badge</mat-icon>
                <input matInput type="text" formControlName="loginIdentifier" autocomplete="username" placeholder="Email, phone, or employee ID" />
                @if (form.controls.loginIdentifier.invalid && form.controls.loginIdentifier.touched) {
                  <mat-error>Enter your login ID</mat-error>
                }
              </mat-form-field>

              <button
                mat-flat-button
                type="submit"
                class="full-width submit-btn"
                [disabled]="loading"
                [style.background]="primaryColor">
                @if (loading) {
                  <mat-spinner diameter="22" />
                } @else {
                  Send reset link
                }
              </button>
            </form>
          } @else {
            <div class="success-panel">
              <p class="success-email">
                <mat-icon>alternate_email</mat-icon>
                <span>{{ form.controls.loginIdentifier.value }}</span>
              </p>
              <p class="success-hint">
                Didn't receive it? Check spam or try again in a few minutes.
              </p>
              <button
                mat-stroked-button
                type="button"
                class="full-width"
                (click)="tryAgain()">
                Use a different email
              </button>
            </div>
          }

          @if (resetLink) {
            <div class="dev-reset">
              <p class="dev-label">
                <mat-icon>developer_mode</mat-icon>
                Development reset link
              </p>
              <a mat-flat-button [href]="resetLink" class="full-width dev-link" [style.background]="primaryColor">
                Open reset password page
              </a>
            </div>
          }
        </mat-card-content>

        <mat-card-actions class="auth-actions">
          <a mat-button routerLink="/auth/login" class="back-link">
            <mat-icon>arrow_back</mat-icon>
            Back to sign in
          </a>
        </mat-card-actions>
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
        padding: 1.25rem;
      }

      .auth-card {
        width: 100%;
        max-width: 440px;
        padding: 0.5rem 0.75rem 0.75rem;
        border-radius: 16px;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
      }

      .avatar-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 102, 0, 0.12);
        color: #ff6600;
        border-radius: 12px;
      }

      .avatar-wrap--success {
        background: rgba(18, 183, 106, 0.12);
        color: #12b76a;
      }

      .brand-logo {
        width: 40px;
        height: 40px;
        object-fit: contain;
        border-radius: 6px;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-top: 0.5rem;
      }

      .full-width {
        width: 100%;
      }

      .submit-btn {
        margin-top: 0.75rem;
        height: 48px;
        color: #fff;
        font-weight: 600;
      }

      .success-panel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 0.5rem;
      }

      .success-email {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        padding: 0.875rem 1rem;
        background: #f9fafb;
        border: 1px solid #e4e7ec;
        border-radius: 10px;
        font-weight: 600;
        color: #101828;
        word-break: break-all;
      }

      .success-email mat-icon {
        flex-shrink: 0;
        color: #667085;
      }

      .success-hint {
        margin: 0;
        font-size: 0.875rem;
        color: #667085;
        line-height: 1.5;
      }

      .dev-reset {
        margin-top: 1.25rem;
        padding: 1rem;
        border-radius: 10px;
        background: #fffbeb;
        border: 1px dashed #f79009;
      }

      .dev-label {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        margin: 0 0 0.75rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #b54708;
      }

      .dev-label mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .dev-link {
        color: #fff;
        text-decoration: none;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-weight: 500;
      }

      .auth-actions {
        display: flex;
        justify-content: center;
        padding-bottom: 0.5rem;
      }

      .back-link mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class ForgotPasswordPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  readonly branding = inject(BrandingService);

  loading = false;
  resetLink: string | null = null;
  readonly sent = signal(false);

  readonly form = this.fb.nonNullable.group({
    loginIdentifier: ['', [Validators.required, Validators.maxLength(100)]],
  });

  get primaryColor(): string {
    return this.branding.primaryColor();
  }

  get pageBackgroundStyle(): Record<string, string> {
    return { background: BrandingService.loginBackgroundStyle(this.branding.branding()) };
  }

  ngOnInit(): void {
    const remembered =
      localStorage.getItem('gym_remember_login_id') ?? localStorage.getItem('gym_remember_email');
    if (remembered) {
      this.form.controls.loginIdentifier.setValue(remembered);
    }
  }

  tryAgain(): void {
    this.sent.set(false);
    this.resetLink = null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.resetLink = null;

    const loginIdentifier = this.form.controls.loginIdentifier.value.trim();
    this.auth.forgotPassword(loginIdentifier).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.sent.set(true);
          this.resetLink = res.data?.resetLink ?? null;
          this.notify.success(
            res.message ?? 'If the email exists, a password reset link has been sent.'
          );
          if (!this.resetLink) {
            setTimeout(() => this.router.navigate(['/auth/login']), 5000);
          }
        } else {
          this.notify.error(res.message ?? 'Request failed');
        }
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err.error?.message ?? 'Request failed');
      },
    });
  }
}
