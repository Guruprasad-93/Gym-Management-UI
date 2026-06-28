import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import {
  COUNTRY_PHONE_RULES,
  buildPhoneNumber,
  clampNationalNumber,
  getCountryRule,
  nationalLengthHint,
  phoneValidationError,
  splitPhoneNumber,
} from '../../utils/phone.util';
import { phoneErrorMessage } from '../../validators/phone.validators';

@Component({
  selector: 'app-phone-field',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneFieldComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneFieldComponent),
      multi: true,
    },
  ],
  template: `
    <div class="phone-field">
      <mat-form-field appearance="outline" class="phone-field__code">
        <mat-label>Country</mat-label>
        <mat-select [formControl]="countryCode">
          @for (country of countries; track country.code) {
            <mat-option [value]="country.code">{{ country.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="phone-field__number">
        <mat-label>{{ label }}</mat-label>
        <input
          matInput
          type="tel"
          inputmode="numeric"
          [formControl]="nationalNumber"
          [attr.maxlength]="maxLength()"
          (keydown)="blockInvalidKeys($event)"
          [placeholder]="placeholder()"
        />
        <mat-hint>{{ lengthHint() }}</mat-hint>
        @if (nationalNumber.invalid && nationalNumber.touched) {
          <mat-error>{{ displayError() }}</mat-error>
        }
      </mat-form-field>
    </div>
  `,
  styles: [
    `
      .phone-field {
        display: grid;
        grid-template-columns: minmax(140px, 180px) 1fr;
        gap: 0.75rem;
        width: 100%;
      }
      .phone-field__code,
      .phone-field__number {
        width: 100%;
      }
      @media (max-width: 640px) {
        .phone-field {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PhoneFieldComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  @Input() label = 'Phone Number';
  @Input() required = false;

  readonly countries = COUNTRY_PHONE_RULES;
  readonly countryCode = this.fb.nonNullable.control('+91');
  readonly nationalNumber = this.fb.nonNullable.control('');
  readonly maxLength = signal(10);
  readonly placeholder = signal('9876543210');
  readonly lengthHint = signal('10 digits');

  private subs = new Subscription();
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  ngOnInit(): void {
    this.applyCountryRules(this.countryCode.value);

    this.subs.add(
      this.countryCode.valueChanges.subscribe((code) => {
        this.applyCountryRules(code);
        const clamped = clampNationalNumber(code, this.nationalNumber.value);
        if (clamped !== this.nationalNumber.value) {
          this.nationalNumber.setValue(clamped, { emitEvent: false });
        }
        this.emitValue();
      })
    );

    this.subs.add(
      this.nationalNumber.valueChanges.subscribe((value) => {
        const clamped = clampNationalNumber(this.countryCode.value, value.replace(/\D/g, ''));
        if (clamped !== value) {
          this.nationalNumber.setValue(clamped, { emitEvent: false });
        }
        this.emitValue();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  writeValue(value: string | null): void {
    const split = splitPhoneNumber(value);
    this.countryCode.setValue(split.countryCode, { emitEvent: false });
    this.applyCountryRules(split.countryCode);
    this.nationalNumber.setValue(clampNationalNumber(split.countryCode, split.nationalNumber), {
      emitEvent: false,
    });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.countryCode.disable({ emitEvent: false });
      this.nationalNumber.disable({ emitEvent: false });
    } else {
      this.countryCode.enable({ emitEvent: false });
      this.nationalNumber.enable({ emitEvent: false });
    }
  }

  validate(): ValidationErrors | null {
    const code = this.countryCode.value;
    const national = this.nationalNumber.value;

    if (!national.replace(/\D/g, '')) {
      const error = this.required ? { phoneRequired: true } : null;
      this.nationalNumber.setErrors(error, { emitEvent: false });
      return error;
    }

    const message = phoneValidationError(code, national);
    if (message) {
      const error = { phoneInvalid: true, phoneMessage: message };
      this.nationalNumber.setErrors(error, { emitEvent: false });
      return error;
    }

    this.nationalNumber.setErrors(null, { emitEvent: false });
    return null;
  }

  displayError(): string {
    return phoneErrorMessage(this.nationalNumber.errors);
  }

  blockInvalidKeys(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const rule = getCountryRule(this.countryCode.value);
    if (!rule) return;

    const input = event.target as HTMLInputElement;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const current = this.nationalNumber.value.replace(/\D/g, '');
    const replacing = Math.max(0, end - start);
    if (current.length - replacing >= rule.maxNationalDigits) {
      event.preventDefault();
    }
  }

  private applyCountryRules(code: string): void {
    const rule = getCountryRule(code);
    this.maxLength.set(rule?.maxNationalDigits ?? 15);
    this.placeholder.set(rule?.example ?? '');
    this.lengthHint.set(nationalLengthHint(code));
  }

  private emitValue(): void {
    const full = buildPhoneNumber(this.countryCode.value, this.nationalNumber.value);
    this.onChange(full);
    this.onTouched();
  }
}
