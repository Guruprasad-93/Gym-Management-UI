export const SubscriptionAccessModes = {
  Active: 'Active',
  GracePeriod: 'GracePeriod',
  ExpiredAdminRenewal: 'ExpiredAdminRenewal',
  ExpiredLocked: 'ExpiredLocked',
} as const;

export type SubscriptionAccessMode =
  (typeof SubscriptionAccessModes)[keyof typeof SubscriptionAccessModes];

export const GYM_ADMIN_RENEWAL_ROUTES = [
  '/gym-admin/renew-subscription',
  '/gym-admin/subscription',
] as const;

export const SUBSCRIPTION_EXPIRED_MESSAGE =
  'Your gym subscription has expired. Please contact your gym administrator.';
