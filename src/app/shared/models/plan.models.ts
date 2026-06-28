export interface SystemFeature {
  featureId: number;
  featureCode: string;
  featureName: string;
  description?: string;
  category: string;
  menuRoute?: string;
  menuIcon?: string;
  isMenuFeature: boolean;
  isApiFeature: boolean;
  isQuotaFeature: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface PlanQuota {
  planQuotaId?: number;
  saasPlanId?: number;
  maxMembers: number;
  maxTrainers: number;
  maxBranches: number;
  maxStorageGB: number;
  maxSmsPerMonth: number;
  maxWhatsappMessages: number;
}

export interface PlanPricingOption {
  pricingOptionId: number;
  saasPlanId: number;
  durationValue: number;
  durationUnit: string;
  price: number;
  currency: string;
  displayLabel?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface PlanFeatureAssignment {
  planFeatureId?: number;
  saasPlanId?: number;
  featureId: number;
  featureCode: string;
  featureName: string;
  category: string;
  isIncluded: boolean;
}

export interface PlanSummary {
  id: number;
  planCode: string;
  planName: string;
  description?: string;
  isTrialPlan: boolean;
  isPublic: boolean;
  trialDays: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  activeSubscriberCount: number;
  featureCount: number;
  pricingOptionCount: number;
  quotas?: PlanQuota;
}

export interface DynamicPlan extends PlanSummary {
  features: PlanFeatureAssignment[];
  pricingOptions: PlanPricingOption[];
  monthlyPrice?: number;
  quarterlyPrice?: number;
  halfYearlyPrice?: number;
  yearlyPrice?: number;
}

export interface UpsertPlanQuota {
  maxMembers: number;
  maxTrainers: number;
  maxBranches: number;
  maxStorageGB: number;
  maxSmsPerMonth: number;
  maxWhatsappMessages: number;
}

export interface CreatePlanRequest {
  planCode: string;
  planName: string;
  description?: string;
  isTrialPlan: boolean;
  isPublic: boolean;
  trialDays: number;
  sortOrder: number;
  quotas?: UpsertPlanQuota;
  featureIds: number[];
}

export interface UpdatePlanRequest extends CreatePlanRequest {
  isActive: boolean;
}

export interface ClonePlanRequest {
  planCode: string;
  planName: string;
  description?: string;
  isTrialPlan?: boolean;
  isPublic?: boolean;
  sortOrder?: number;
}

export interface UpsertPricingOptionRequest {
  durationValue: number;
  durationUnit: string;
  price: number;
  displayLabel?: string;
  sortOrder: number;
  isActive?: boolean;
}

export interface ReorderPricingRequest {
  items: { pricingOptionId: number; sortOrder: number }[];
}

export interface FeatureDependencyViolation {
  featureCode: string;
  requiresFeatureCode: string;
  message: string;
}

export interface FeatureDependencyValidation {
  isValid: boolean;
  violations: FeatureDependencyViolation[];
}

export interface SaasPlanCatalog {
  plans: SaasPlanCatalogItem[];
}

export interface SaasPlanCatalogItem {
  id: number;
  planCode: string;
  planName: string;
  description?: string;
  sortOrder: number;
  quotas: PlanQuota;
  pricingOptions: PlanPricingOption[];
  features: PlanFeatureAssignment[];
}

export interface GymFeatures {
  subscriptionFeatureCodes: string[];
  enabledFeatureCodes: string[];
  visibleMenuCodes: string[];
}

/** -1 means unlimited in UI forms */
export const UNLIMITED_QUOTA = -1;

export function formatQuota(value: number, unit = ''): string {
  if (value < 0) return 'Unlimited';
  return unit ? `${value} ${unit}` : String(value);
}

export function durationLabel(option: PlanPricingOption): string {
  return option.displayLabel || `${option.durationValue} ${option.durationUnit}`;
}
