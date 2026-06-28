import { Component, OnInit, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BrandingService } from '../../../core/services/branding.service';
import { PasswordFieldComponent } from '../../../shared/components/password-field/password-field.component';
import { getDefaultRouteForUser } from '../../../core/constants/menu.config';

const REMEMBER_LOGIN_KEY = 'gym_remember_login_id';
const LEGACY_REMEMBER_EMAIL_KEY = 'gym_remember_email';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    NgStyle,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    PasswordFieldComponent,
  ],
  template: `
    <div class="auth-page" [ngStyle]="pageBackgroundStyle">
      <mat-card class="auth-card">
        <mat-card-header>
          <div mat-card-avatar class="avatar-wrap">
            @if (branding.logoUrl()) {
              <img [src]="branding.logoUrl()!" alt="Logo" class="brand-logo" />
            } @else {
              <mat-icon>fitness_center</mat-icon>
            }
          </div>
          <mat-card-title>{{ displayName }}</mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Login ID</mat-label>
              <input matInput type="text" formControlName="loginIdentifier" autocomplete="username" />
              @if (form.controls.loginIdentifier.invalid && form.controls.loginIdentifier.touched) {
                <mat-error>Login ID is required</mat-error>
              }
            </mat-form-field>
            <app-password-field
              label="Password"
              [control]="form.controls.password"
              autocomplete="current-password"
              requiredMessage="Password is required (min 6 characters)"
              minLengthMessage="Password is required (min 6 characters)"
            />
            <mat-checkbox formControlName="rememberMe">Remember me</mat-checkbox>
            <button mat-flat-button class="full-width submit-btn" [disabled]="loading" [style.background]="primaryColor">
              @if (loading) {
                <mat-spinner diameter="22" />
              } @else {
                Sign In
              }
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button routerLink="/auth/forgot-password">Forgot password?</a>
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
        background: linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #5c6bc0 100%);
        padding: 1rem;
      }
      .auth-card {
        width: 100%;
        max-width: 420px;
        padding: 0.5rem;
      }
      .brand-logo {
        width: 40px;
        height: 40px;
        object-fit: contain;
        border-radius: 4px;
      }
      .avatar-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .full-width {
        width: 100%;
        display: block;
      }
      .submit-btn {
        margin-top: 1rem;
        height: 48px;
        color: #fff;
      }
    `,
  ],
})
export class LoginPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  readonly branding = inject(BrandingService);

  loading = false;

  readonly form = this.fb.nonNullable.group({
    loginIdentifier: [
      localStorage.getItem(REMEMBER_LOGIN_KEY) ??
        localStorage.getItem(LEGACY_REMEMBER_EMAIL_KEY) ??
        '',
      [Validators.required, Validators.maxLength(100)],
    ],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  get displayName(): string {
    return this.branding.appName();
  }

  get primaryColor(): string {
    return this.branding.primaryColor();
  }

  get pageBackgroundStyle(): Record<string, string> {
    return { background: BrandingService.loginBackgroundStyle(this.branding.branding()) };
  }

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const host = window.location.hostname;
    const subDomain = params.get('subDomain') ?? this.resolveSubDomainFromHost();
    const customDomain = params.get('customDomain')
      ?? (host !== 'localhost' && !host.startsWith('127.') ? host : undefined);
    const gymId = params.get('gymId') ?? undefined;

    if (subDomain || customDomain || gymId) {
      this.branding.loadPublicBranding({ subDomain: subDomain || undefined, customDomain, gymId }).subscribe();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { loginIdentifier, password, rememberMe } = this.form.getRawValue();
    const trimmedId = loginIdentifier.trim();
    if (rememberMe) {
      localStorage.setItem(REMEMBER_LOGIN_KEY, trimmedId);
    } else {
      localStorage.removeItem(REMEMBER_LOGIN_KEY);
    }

    this.auth
      .login({
        loginIdentifier: trimmedId,
        password,
      })
      .subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          if (res.data.mustChangePassword) {
            this.notify.warning('You must change your password before continuing.');
            this.router.navigate(['/auth/change-password']);
            return;
          }
          this.notify.success('Login successful');
          this.router.navigateByUrl(getDefaultRouteForUser(res.data.roles));
          return;
        }
        this.notify.error(res.message ?? 'Login failed');
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err.error?.message ?? 'Invalid login ID or password');
      },
    });
  }

  private resolveSubDomainFromHost(): string | undefined {
    const host = window.location.hostname;
    if (!host.includes('.gymsaas.com')) return undefined;
    const part = host.split('.')[0];
    return part && part !== 'www' ? part : undefined;
  }
}
