import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>
      <input
        matInput
        [type]="visible ? 'text' : 'password'"
        [formControl]="control"
        [autocomplete]="autocomplete"
      />
      <button
        mat-icon-button
        matSuffix
        type="button"
        (click)="visible = !visible"
        [attr.aria-label]="visible ? 'Hide password' : 'Show password'">
        <mat-icon>{{ visible ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>
      @if (control.invalid && control.touched) {
        @if (control.hasError('required')) {
          <mat-error>{{ requiredMessage }}</mat-error>
        } @else if (control.hasError('minlength')) {
          <mat-error>{{ minLengthMessage }}</mat-error>
        } @else if (control.hasError('passwordMismatch')) {
          <mat-error>{{ mismatchMessage }}</mat-error>
        }
      }
    </mat-form-field>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class PasswordFieldComponent {
  @Input({ required: true }) control!: FormControl<string>;
  @Input({ required: true }) label!: string;
  @Input() autocomplete = 'current-password';
  @Input() requiredMessage = 'Password is required.';
  @Input() minLengthMessage = 'Minimum 8 characters.';
  @Input() mismatchMessage = 'Confirm Password does not match New Password.';

  visible = false;
}
