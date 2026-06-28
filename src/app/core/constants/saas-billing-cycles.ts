export const SaasBillingCycles = {
  Monthly: 'Monthly',
  Quarterly: 'Quarterly',
  HalfYearly: 'HalfYearly',
  Yearly: 'Yearly',
} as const;

export type SaasBillingCycle = (typeof SaasBillingCycles)[keyof typeof SaasBillingCycles];

export const SAAS_BILLING_CYCLE_OPTIONS: ReadonlyArray<{
  value: SaasBillingCycle;
  label: string;
  months: number;
}> = [
  { value: SaasBillingCycles.Monthly, label: 'Monthly', months: 1 },
  { value: SaasBillingCycles.Quarterly, label: 'Quarterly (3 months)', months: 3 },
  { value: SaasBillingCycles.HalfYearly, label: 'Half-Yearly (6 months)', months: 6 },
  { value: SaasBillingCycles.Yearly, label: 'Yearly (12 months)', months: 12 },
];

export function getPlanPriceForCycle(
  plan: {
    monthlyPrice: number;
    quarterlyPrice?: number;
    halfYearlyPrice?: number;
    yearlyPrice: number;
  },
  billingCycle: string
): number {
  switch (billingCycle) {
    case SaasBillingCycles.Quarterly:
      return plan.quarterlyPrice ?? plan.monthlyPrice * 3;
    case SaasBillingCycles.HalfYearly:
      return plan.halfYearlyPrice ?? plan.monthlyPrice * 6;
    case SaasBillingCycles.Yearly:
      return plan.yearlyPrice;
    default:
      return plan.monthlyPrice;
  }
}
