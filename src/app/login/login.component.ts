import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { BrandingService } from '../core/services/branding.service';
import { getDefaultRouteForUser } from '../core/constants/menu.config';

const REMEMBER_LOGIN_KEY = 'gym_remember_login_id';
const LEGACY_REMEMBER_EMAIL_KEY = 'gym_remember_email';

const DEFAULT_HERO_BG =
  'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80)';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  submitted = false;
  loading = false;
  showPassword = false;
  errorMessage: string | null = null;
  readonly branding = inject(BrandingService);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({
      loginIdentifier: [
        localStorage.getItem(REMEMBER_LOGIN_KEY) ??
          localStorage.getItem(LEGACY_REMEMBER_EMAIL_KEY) ??
          '',
        [Validators.required, Validators.maxLength(100)],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [
        !!(localStorage.getItem(REMEMBER_LOGIN_KEY) ?? localStorage.getItem(LEGACY_REMEMBER_EMAIL_KEY)),
      ],
    });
  }

  get loginIdentifierControl() {
    return this.form.get('loginIdentifier');
  }

  get passwordControl() {
    return this.form.get('password');
  }

  get primaryColor(): string {
    return this.branding.primaryColor();
  }

  get brandName(): string {
    return this.branding.appName().toUpperCase();
  }

  get brandTagline(): string {
    const source = this.branding.branding();
    return source?.brandName?.trim() ? source.brandName.toUpperCase() : 'GYM MANAGEMENT';
  }

  get supportEmail(): string | null {
    return this.branding.branding()?.supportEmail ?? null;
  }

  get heroBackground(): string {
    const bg = this.branding.branding()?.loginBackgroundUrl;
    return bg ? `url(${bg})` : DEFAULT_HERO_BG;
  }

  ngOnInit(): void {
    this.loadBranding();
  }

  submit(): void {
    this.submitted = true;
    this.errorMessage = null;

    if (this.form.invalid) return;

    this.loading = true;
    const { loginIdentifier, password, rememberMe } = this.form.getRawValue();
    const trimmedId = (loginIdentifier ?? '').trim();

    if (rememberMe) {
      localStorage.setItem(REMEMBER_LOGIN_KEY, trimmedId);
    } else {
      localStorage.removeItem(REMEMBER_LOGIN_KEY);
    }

    this.auth
      .login({
        loginIdentifier: trimmedId,
        password: password!,
      })
      .subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          if (response.data.mustChangePassword) {
            this.router.navigate(['/auth/change-password']);
            return;
          }
          this.router.navigateByUrl(getDefaultRouteForUser(response.data.roles));
          return;
        }
        this.errorMessage = response.message ?? 'Login failed.';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'Invalid login ID or password.';
      },
    });
  }

  private loadBranding(): void {
    const params = new URLSearchParams(window.location.search);
    const host = window.location.hostname;
    const subDomain = params.get('subDomain') ?? this.resolveSubDomainFromHost();
    const customDomain =
      params.get('customDomain') ??
      (host !== 'localhost' && !host.startsWith('127.') ? host : undefined);
    const gymId = params.get('gymId') ?? undefined;

    if (subDomain || customDomain || gymId) {
      this.branding.loadPublicBranding({ subDomain: subDomain || undefined, customDomain, gymId }).subscribe();
    }
  }

  private resolveSubDomainFromHost(): string | undefined {
    const host = window.location.hostname;
    if (!host.includes('.gymsaas.com')) return undefined;
    const part = host.split('.')[0];
    return part && part !== 'www' ? part : undefined;
  }
}
