export function uniqueLoginIdentifier(prefix = 'e2e'): string {
  const random = Math.random().toString(36).slice(2, 10);
  const id = `${prefix}${random}`.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return id.slice(0, 20);
}

export const NOTIFICATION_TYPES = [
  'MembershipExpiry7Days',
  'MembershipExpiry3Days',
  'MembershipExpiryToday',
  'PaymentSuccess',
  'MembershipRenewal',
  'NewMemberRegistration',
  'WorkoutPlanAssigned',
  'DietPlanAssigned',
] as const;

export function pickUnusedNotificationType(existingTypes: string[]): string {
  const normalized = new Set(existingTypes.map((t) => t.trim()));
  const unused = NOTIFICATION_TYPES.find((t) => !normalized.has(t));
  if (!unused) {
    throw new Error(`All notification types already have templates: ${existingTypes.join(', ')}`);
  }
  return unused;
}

export function uniqueMemberName(prefix = 'E2E Member'): string {
  return `${prefix} ${Date.now()}`;
}

export function uniqueTrainerName(prefix = 'E2E Trainer'): string {
  return `${prefix} ${Date.now()}`;
}

export function uniqueLeadName(prefix = 'E2E Lead'): string {
  return `${prefix} ${Date.now()}`;
}

export function uniquePlanName(prefix = 'E2E Plan'): string {
  return `${prefix} ${Date.now()}`;
}

export function uniqueBranchName(prefix = 'E2E Branch'): string {
  return `${prefix} ${Date.now()}`;
}

export function uniqueSlug(prefix = 'e2e-gym'): string {
  return `${prefix}-${Date.now().toString(36).slice(-6)}`;
}

export function uniquePageName(prefix = 'E2E Page'): string {
  return `${prefix} ${Date.now()}`;
}

export function uniquePhone(): string {
  const suffix = Date.now().toString().slice(-9);
  return `9${suffix}`.slice(0, 10);
}

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}${Date.now()}@e2e.test`;
}

export function defaultMemberPassword(): string {
  return process.env.E2E_MEMBER_PASSWORD ?? 'E2eTest@12345';
}

export function defaultTrainerPassword(): string {
  return process.env.E2E_TRAINER_PASSWORD ?? 'E2eTest@12345';
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
