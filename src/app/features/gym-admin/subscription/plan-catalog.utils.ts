import {
  formatQuota,
  PlanFeatureAssignment,
  PlanQuota,
  SaasPlanCatalogItem,
} from '../../../shared/models/plan.models';
import { GymSubscription } from '../../../shared/models/saas.models';

export type CheckoutAction = 'purchase' | 'upgrade' | 'renew';

export interface ComparisonFeatureRow {
  featureCode: string;
  featureName: string;
  category: string;
}

export interface QuotaComparisonRow {
  key: keyof PlanQuota;
  label: string;
  values: string[];
}

export function isTrialPlanItem(plan: SaasPlanCatalogItem): boolean {
  return plan.planCode.toUpperCase().includes('TRIAL');
}

export function catalogPlansForPurchase(plans: SaasPlanCatalogItem[]): SaasPlanCatalogItem[] {
  return plans.filter((p) => !isTrialPlanItem(p)).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function resolveCheckoutAction(
  subscription: GymSubscription | null,
  targetPlanId: number,
): CheckoutAction {
  if (!subscription?.hasAccess) return 'purchase';
  if (subscription.status === 'Trial' || subscription.status === 'Expired') return 'purchase';
  if (subscription.saasPlanId === targetPlanId) return 'renew';
  return 'upgrade';
}

export function checkoutActionLabel(action: CheckoutAction): string {
  switch (action) {
    case 'purchase':
      return 'Purchase';
    case 'upgrade':
      return 'Upgrade';
    case 'renew':
      return 'Renew';
  }
}

export function buildFeatureComparisonRows(plans: SaasPlanCatalogItem[]): ComparisonFeatureRow[] {
  const map = new Map<string, ComparisonFeatureRow>();
  for (const plan of plans) {
    for (const feature of plan.features) {
      if (!map.has(feature.featureCode)) {
        map.set(feature.featureCode, {
          featureCode: feature.featureCode,
          featureName: feature.featureName,
          category: feature.category,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) =>
    a.category.localeCompare(b.category) || a.featureName.localeCompare(b.featureName),
  );
}

export function planHasFeature(plan: SaasPlanCatalogItem, featureCode: string): boolean {
  return plan.features.some((f) => f.featureCode === featureCode && f.isIncluded);
}

export function buildQuotaComparisonRows(plans: SaasPlanCatalogItem[]): QuotaComparisonRow[] {
  const defs: { key: keyof PlanQuota; label: string; format?: (v: number) => string }[] = [
    { key: 'maxMembers', label: 'Max Members' },
    { key: 'maxTrainers', label: 'Max Trainers' },
    { key: 'maxBranches', label: 'Max Branches' },
    { key: 'maxStorageGB', label: 'Max Storage (GB)' },
    { key: 'maxSmsPerMonth', label: 'Max SMS / Month' },
    { key: 'maxWhatsappMessages', label: 'Max WhatsApp Messages' },
  ];

  return defs.map((def) => ({
    key: def.key,
    label: def.label,
    values: plans.map((plan) => formatQuota(plan.quotas[def.key] ?? 0)),
  }));
}

export function topFeatures(plan: SaasPlanCatalogItem, limit = 5): PlanFeatureAssignment[] {
  return plan.features.filter((f) => f.isIncluded).slice(0, limit);
}

export function lowestPrice(plan: SaasPlanCatalogItem): number | null {
  const active = plan.pricingOptions.filter((p) => p.isActive);
  if (!active.length) return null;
  return Math.min(...active.map((p) => p.price));
}
