import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  isValidPhoneNumber,
  phoneValidationError,
  splitPhoneNumber,
  PHONE_INVALID_MESSAGE,
} from '../utils/phone.util';

export { PHONE_INVALID_MESSAGE };

export function phoneValidator(required = false): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (!value) return required ? { phoneRequired: true } : null;
    if (!isValidPhoneNumber(value)) {
      const split = splitPhoneNumber(value);
      const message = phoneValidationError(split.countryCode, split.nationalNumber);
      return message ? { phoneInvalid: true, phoneMessage: message } : { phoneInvalid: true };
    }
    return null;
  };
}

export function phoneErrorMessage(errors: ValidationErrors | null): string {
  if (!errors) return '';
  if (errors['phoneRequired']) return 'Phone number is required.';
  if (errors['phoneMessage']) return String(errors['phoneMessage']);
  if (errors['phoneInvalid']) return PHONE_INVALID_MESSAGE;
  return 'Invalid phone number.';
}
