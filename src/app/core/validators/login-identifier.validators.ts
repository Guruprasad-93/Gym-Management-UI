import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/** Matches backend LoginIdentifierRules: max 20, alphanumeric plus . _ - */
export const LOGIN_IDENTIFIER_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const loginIdentifierValidators: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(20),
  Validators.pattern(LOGIN_IDENTIFIER_PATTERN),
];

/** Email is optional; validate format only when non-empty. */
export function optionalEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').toString().trim();
  if (!value) {
    return null;
  }
  return Validators.email(control);
}

/** Derive a login id from email local-part (mirrors backend FromEmailLocalPart). */
export function loginIdentifierFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 20);
}
