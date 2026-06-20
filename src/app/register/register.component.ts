import { CurrencyPipe, CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OnboardingService } from '../core/services/onboarding.service';
import { NotificationService } from '../core/services/notification.service';
import { SaasPlan } from '../shared/models/saas.models';
import {
  loginIdentifierFromEmail,
  loginIdentifierValidators,
  optionalEmailValidator,
} from '../core/validators/login-identifier.validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  form = this.fb.group({
    gymName: ['', [Validators.required, Validators.maxLength(200)]],
    ownerName: ['', [Validators.required, Validators.maxLength(100)]],
    mobile: ['', [Validators.required, Validators.maxLength(20)]],
    loginIdentifier: ['', loginIdentifierValidators],
    email: ['', optionalEmailValidator],
    address: ['', Validators.maxLength(500)],
    password: ['', Validators.minLength(6)],
  });

  submitted = false;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  plans: SaasPlan[] = [];
  currentYear = new Date().getFullYear().toString();

  ngOnInit(): void {
    this.onboarding.getPublicPlans().subscribe({
      next: (res) => { if (res.success && res.data) this.plans = res.data; },
    });

    this.form.controls.email.valueChanges.subscribe((email) => {
      const loginId = this.form.controls.loginIdentifier;
      if (!loginId.dirty && email) {
        loginId.setValue(loginIdentifierFromEmail(email), { emitEvent: false });
      }
    });
  }

  submit(): void {
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;
    if (this.form.invalid) return;

    this.loading = true;
    const v = this.form.getRawValue();
    this.onboarding.register({
      gymName: v.gymName!,
      ownerName: v.ownerName!,
      mobile: v.mobile!,
      loginIdentifier: v.loginIdentifier!,
      email: v.email || undefined,
      address: v.address || undefined,
      password: v.password || undefined,
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.successMessage = res.message ?? res.data.message;
          if (res.data.adminLoginIdentifier) {
            this.successMessage += ` Login ID: ${res.data.adminLoginIdentifier}.`;
          }
          if (res.data.temporaryPassword) {
            this.successMessage += ` Temporary password: ${res.data.temporaryPassword}`;
          }
          this.notify.success('Gym registered! Check your WhatsApp for welcome message.');
          setTimeout(() => this.router.navigate(['/auth/login']), 4000);
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Registration failed. Please try again.';
      },
    });
  }
}
