import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_MISMATCH_MESSAGE = 'Confirm Password does not match New Password.';

export function confirmPasswordValidator(passwordControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) return null;
    const password = parent.get(passwordControlName)?.value;
    if (!control.value) return null;
    return control.value === password ? null : { passwordMismatch: true };
  };
}

export function passwordMatchGroupValidator(
  passwordKey: string,
  confirmKey: string
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;
    if (!confirm) return null;
    return password === confirm ? null : { passwordMismatch: true };
  };
}

export function syncConfirmPasswordValidation(
  passwordControl: AbstractControl,
  confirmControl: AbstractControl
): () => void {
  const handler = () => confirmControl.updateValueAndValidity({ emitEvent: false });
  passwordControl.valueChanges.subscribe(handler);
  return handler;
}
