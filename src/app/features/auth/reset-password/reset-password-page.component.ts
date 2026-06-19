import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BrandingService } from '../../../core/services/branding.service';

function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-title>Reset Password</mat-card-title>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Login ID</mat-label>
              <input matInput type="text" formControlName="loginIdentifier" maxlength="20" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Reset Token</mat-label>
              <input matInput formControlName="token" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New Password</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput type="password" formControlName="confirmPassword" />
              @if (form.hasError('passwordMismatch') && form.touched) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>
            <button mat-flat-button color="primary" class="full-width" [disabled]="loading">
              Reset Password
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/auth/login">Back to login</a>
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
        background: #f4f6f9;
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
    `,
  ],
})
export class ResetPasswordPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly branding = inject(BrandingService);

  loading = false;

  readonly form = this.fb.nonNullable.group(
    {
      loginIdentifier: ['', [Validators.required, Validators.maxLength(20)]],
      token: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  ngOnInit(): void {
    const loginIdentifier = this.route.snapshot.queryParamMap.get('loginIdentifier')
      ?? this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');
    if (loginIdentifier) this.form.controls.loginIdentifier.setValue(loginIdentifier);
    if (token) this.form.controls.token.setValue(token);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { loginIdentifier, token, password } = this.form.getRawValue();
    this.loading = true;
    this.auth
      .resetPassword({
        loginIdentifier,
        gymId: this.branding.branding()?.gymId ?? null,
        token,
        newPassword: password,
      })
      .subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.notify.success('Password reset successfully');
          this.router.navigate(['/auth/login']);
        } else {
          this.notify.error(res.message ?? 'Reset failed');
        }
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err.error?.message ?? 'Reset failed');
      },
    });
  }
}
