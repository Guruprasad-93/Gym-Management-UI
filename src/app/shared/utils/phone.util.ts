const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

export const PHONE_INVALID_MESSAGE =
  'Enter a valid international phone number for the selected country.';

export interface CountryPhoneRule {
  code: string;
  label: string;
  minNationalDigits: number;
  maxNationalDigits: number;
  example: string;
}

/** National number length ranges (excluding country code). */
export const COUNTRY_PHONE_RULES: CountryPhoneRule[] = [
  { code: '+91', label: 'India (+91)', minNationalDigits: 10, maxNationalDigits: 10, example: '9876543210' },
  { code: '+1', label: 'United States (+1)', minNationalDigits: 10, maxNationalDigits: 10, example: '5551234567' },
  { code: '+44', label: 'United Kingdom (+44)', minNationalDigits: 10, maxNationalDigits: 10, example: '7911123456' },
  { code: '+61', label: 'Australia (+61)', minNationalDigits: 9, maxNationalDigits: 9, example: '412345678' },
  { code: '+971', label: 'UAE (+971)', minNationalDigits: 9, maxNationalDigits: 9, example: '501234567' },
  { code: '+65', label: 'Singapore (+65)', minNationalDigits: 8, maxNationalDigits: 8, example: '91234567' },
  { code: '+49', label: 'Germany (+49)', minNationalDigits: 10, maxNationalDigits: 11, example: '15123456789' },
  { code: '+33', label: 'France (+33)', minNationalDigits: 9, maxNationalDigits: 9, example: '612345678' },
  { code: '+81', label: 'Japan (+81)', minNationalDigits: 10, maxNationalDigits: 10, example: '9012345678' },
  { code: '+86', label: 'China (+86)', minNationalDigits: 11, maxNationalDigits: 11, example: '13912345678' },
];

/** @deprecated Use COUNTRY_PHONE_RULES */
export const COUNTRY_DIAL_CODES = COUNTRY_PHONE_RULES.map(({ code, label }) => ({ code, label }));

export function getCountryRule(countryCode: string): CountryPhoneRule | undefined {
  return COUNTRY_PHONE_RULES.find((r) => r.code === countryCode);
}

export function normalizePhoneNumber(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return `+${digits}`;
}

export function buildPhoneNumber(countryCode: string, nationalNumber: string): string {
  const codeDigits = countryCode.replace(/\D/g, '');
  const nationalDigits = nationalNumber.replace(/\D/g, '');
  if (!codeDigits || !nationalDigits) return '';
  return `+${codeDigits}${nationalDigits}`;
}

export function clampNationalNumber(countryCode: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, '');
  const rule = getCountryRule(countryCode);
  if (!rule) return digits.slice(0, 15);
  return digits.slice(0, rule.maxNationalDigits);
}

export function isValidNationalNumberForCountry(countryCode: string, nationalNumber: string): boolean {
  const digits = nationalNumber.replace(/\D/g, '');
  const rule = getCountryRule(countryCode);
  if (!rule) {
    return digits.length >= 7 && digits.length <= 15;
  }
  return digits.length >= rule.minNationalDigits && digits.length <= rule.maxNationalDigits;
}

export function nationalLengthHint(countryCode: string): string {
  const rule = getCountryRule(countryCode);
  if (!rule) return '7–15 digits';
  if (rule.minNationalDigits === rule.maxNationalDigits) {
    return `${rule.maxNationalDigits} digits`;
  }
  return `${rule.minNationalDigits}–${rule.maxNationalDigits} digits`;
}

export function phoneValidationError(countryCode: string, nationalNumber: string): string | null {
  const digits = nationalNumber.replace(/\D/g, '');
  if (!digits) return null;

  const rule = getCountryRule(countryCode);
  if (!rule) {
    return digits.length >= 7 && digits.length <= 15 ? null : PHONE_INVALID_MESSAGE;
  }

  if (digits.length < rule.minNationalDigits) {
    return `Enter at least ${rule.minNationalDigits} digits for ${rule.label}.`;
  }
  if (digits.length > rule.maxNationalDigits) {
    return `Maximum ${rule.maxNationalDigits} digits allowed for ${rule.label}.`;
  }
  return null;
}

export function isValidPhoneNumber(value: string | null | undefined): boolean {
  const normalized = normalizePhoneNumber(value);
  if (!normalized || !E164_PATTERN.test(normalized)) return false;

  const split = splitPhoneNumber(normalized);
  return isValidNationalNumberForCountry(split.countryCode, split.nationalNumber);
}

export function splitPhoneNumber(value: string | null | undefined): { countryCode: string; nationalNumber: string } {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return { countryCode: '+91', nationalNumber: '' };

  const match = COUNTRY_PHONE_RULES
    .map((c) => c.code)
    .sort((a, b) => b.length - a.length)
    .find((code) => normalized.startsWith(code));

  if (match) {
    return {
      countryCode: match,
      nationalNumber: normalized.slice(match.length),
    };
  }

  return { countryCode: '+91', nationalNumber: normalized.replace(/^\+/, '') };
}
