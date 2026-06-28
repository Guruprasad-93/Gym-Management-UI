import { FeatureDependencyValidation, FeatureDependencyViolation } from '../../../shared/models/plan.models';

const DEFAULT_DEPENDENCIES: Record<string, string[]> = {
  WEBSITE_BUILDER: ['PUBLIC_WEBSITE'],
  AI_INSIGHTS: ['REPORTS'],
  MULTI_BRANCH: ['MEMBERS', 'TRAINERS'],
};

const FEATURE_LABELS: Record<string, string> = {
  WEBSITE_BUILDER: 'Website Builder',
  PUBLIC_WEBSITE: 'Public Website',
  AI_INSIGHTS: 'AI Insights',
  REPORTS: 'Reports',
  MULTI_BRANCH: 'Multi Branch',
  MEMBERS: 'Members',
  TRAINERS: 'Trainers',
};

export function friendlyFeatureName(code: string): string {
  return FEATURE_LABELS[code] ?? code.replace(/_/g, ' ');
}

export function validateFeatureDependencies(
  selectedFeatureCodes: string[],
  dependencyMap: Record<string, string[]> = DEFAULT_DEPENDENCIES,
): FeatureDependencyValidation {
  const selected = new Set(selectedFeatureCodes.map((c) => c.toUpperCase()));
  const violations: FeatureDependencyViolation[] = [];

  for (const featureCode of selected) {
    const requiredCodes = dependencyMap[featureCode] ?? dependencyMap[featureCode.toUpperCase()];
    if (!requiredCodes?.length) continue;

    for (const required of requiredCodes) {
      if (!selected.has(required.toUpperCase())) {
        violations.push({
          featureCode,
          requiresFeatureCode: required,
          message: `${friendlyFeatureName(featureCode)} requires ${friendlyFeatureName(required)}.`,
        });
      }
    }
  }

  return { isValid: violations.length === 0, violations };
}

export function missingDependencyCodes(validation: FeatureDependencyValidation): Set<string> {
  return new Set(validation.violations.map((v) => v.requiresFeatureCode.toUpperCase()));
}
