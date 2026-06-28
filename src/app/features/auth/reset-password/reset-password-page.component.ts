import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PasswordFieldComponent } from '../../../shared/components/password-field/password-field.component';
import {
  PASSWORD_MISMATCH_MESSAGE,
  confirmPasswordValidator,
} from '../../../shared/validators/password.validators';

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
    PasswordFieldComponent,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-title>Reset Password</mat-card-title>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Login ID</mat-label>
              <input matInput type="text" formControlName="loginIdentifier" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Reset Token</mat-label>
              <input matInput formControlName="token" />
            </mat-form-field>
            <app-password-field
              label="New Password"
              [control]="form.controls.password"
              autocomplete="new-password"
              minLengthMessage="Minimum 8 characters"
            />
            <app-password-field
              label="Confirm Password"
              [control]="form.controls.confirmPassword"
              autocomplete="new-password"
              [mismatchMessage]="mismatchMessage"
            />
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
export class ResetPasswordPageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly mismatchMessage = PASSWORD_MISMATCH_MESSAGE;
  loading = false;
  private subs = new Subscription();

  readonly form = this.fb.nonNullable.group({
    loginIdentifier: ['', [Validators.required, Validators.maxLength(100)]],
    token: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, confirmPasswordValidator('password')]],
  });

  ngOnInit(): void {
    const loginIdentifier =
      this.route.snapshot.queryParamMap.get('loginIdentifier') ??
      this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');
    if (loginIdentifier) this.form.controls.loginIdentifier.setValue(loginIdentifier);
    if (token) this.form.controls.token.setValue(token);

    this.subs.add(
      this.form.controls.password.valueChanges.subscribe(() =>
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
    const { loginIdentifier, token, password, confirmPassword } = this.form.getRawValue();
    this.loading = true;
    this.auth
      .resetPassword({
        loginIdentifier,
        token,
        newPassword: password,
        confirmPassword,
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
