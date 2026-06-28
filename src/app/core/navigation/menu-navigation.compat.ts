import { AppMenuItem } from '../constants/menu.config';
import { Roles } from '../constants/roles';

/**
 * Compatibility layer for feature-driven navigation.
 * When enabledFeatureCodes is empty (legacy session / Super Admin), permission-only filtering applies.
 * When populated, items with featureCode require hasFeature() in addition to RBAC.
 */
export function filterMenuItemsWithFeatures(
  items: AppMenuItem[],
  roles: string[],
  permissions: string[],
  enabledFeatureCodes: readonly string[],
  hasFeature: (code: string) => boolean
): AppMenuItem[] {
  const useFeatureGate = shouldUseFeatureGate(roles, enabledFeatureCodes);

  return items.filter((item) => {
    if (item.visible === false) {
      return false;
    }

    if (item.roles?.length && !item.roles.some((r) => roles.includes(r))) {
      return false;
    }

    if (item.permissions?.length && !item.permissions.some((p) => permissions.includes(p))) {
      return false;
    }

    if (useFeatureGate && item.featureCode && !hasFeature(item.featureCode)) {
      return false;
    }

    return true;
  });
}

export function shouldUseFeatureGate(roles: string[], enabledFeatureCodes: readonly string[]): boolean {
  if (roles.includes(Roles.SuperAdmin)) {
    return false;
  }

  return enabledFeatureCodes.length > 0;
}

export function createFeatureChecker(enabledFeatureCodes: readonly string[]): (code: string) => boolean {
  const set = new Set(enabledFeatureCodes.map((c) => c.toUpperCase()));
  return (code: string) => set.has(code.toUpperCase());
}
