import { Permissions } from './permissions';
import { Roles } from './roles';

export interface AppMenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  permissions?: string[];
  /** Subscription feature code; gated only when session has enabledFeatureCodes. */
  featureCode?: string;
  /** When false, item is omitted from sidebar navigation (route remains accessible). Default: true */
  visible?: boolean;
}

/**
 * Member Portal sidebar visibility toggles.
 * Set a value to `true` to show the menu item again (routes stay active either way).
 */
export const MEMBER_PORTAL_MENU_VISIBILITY = {
  referrals: false,
  payMembership: false,
} as const;

export const SUPER_ADMIN_MENU: AppMenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/super-admin', permissions: [Permissions.ViewDashboard] },
  { label: 'Gyms', icon: 'fitness_center', route: '/super-admin/gyms', permissions: [Permissions.ViewGyms] },
  { label: 'Gym Admins', icon: 'manage_accounts', route: '/super-admin/gym-admins', permissions: [Permissions.ViewGymAdmins] },
  { label: 'Subscription Plans', icon: 'subscriptions', route: '/super-admin/subscription-plans', permissions: [Permissions.ManageSubscriptionPlans] },
  { label: 'Roles', icon: 'admin_panel_settings', route: '/super-admin/roles', permissions: [Permissions.ViewRoles] },
  { label: 'Privileges', icon: 'security', route: '/super-admin/privileges', permissions: [Permissions.ViewPrivileges] },
  { label: 'Role Matrix', icon: 'grid_on', route: '/super-admin/role-matrix', permissions: [Permissions.ViewPermissionMatrix] },
  { label: 'Audit Logs', icon: 'history', route: '/super-admin/audit', permissions: [Permissions.ViewAuditLogs] },
  { label: 'White Label', icon: 'palette', route: '/super-admin/white-label', permissions: [Permissions.ViewPlatformSaas] },
];

export const GYM_ADMIN_MENU: AppMenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/gym-admin/dashboard', permissions: [Permissions.ViewAnalytics, Permissions.ViewDashboard], featureCode: 'DASHBOARD' },
  { label: 'Revenue Analytics', icon: 'trending_up', route: '/gym-admin/analytics/revenue', permissions: [Permissions.ViewRevenueAnalytics], featureCode: 'REPORTS' },
  { label: 'Member Analytics', icon: 'groups', route: '/gym-admin/analytics/members', permissions: [Permissions.ViewMemberAnalytics], featureCode: 'REPORTS' },
  { label: 'Attendance Analytics', icon: 'bar_chart', route: '/gym-admin/analytics/attendance', permissions: [Permissions.ViewAnalytics], featureCode: 'REPORTS' },
  { label: 'Trainer Analytics', icon: 'sports', route: '/gym-admin/analytics/trainers', permissions: [Permissions.ViewAnalytics], featureCode: 'REPORTS' },
  { label: 'Members', icon: 'groups', route: '/gym-admin/members', permissions: [Permissions.ViewMembers], featureCode: 'MEMBERS' },
  { label: 'Leads & CRM', icon: 'contact_page', route: '/gym-admin/leads', permissions: [Permissions.ViewLeads], featureCode: 'CRM' },
  { label: 'Expenses', icon: 'receipt_long', route: '/gym-admin/expenses', permissions: [Permissions.ViewExpenses], featureCode: 'REPORTS' },
  { label: 'Payroll', icon: 'payments', route: '/gym-admin/payroll', permissions: [Permissions.ViewPayroll], featureCode: 'REPORTS' },
  { label: 'Financial', icon: 'account_balance', route: '/gym-admin/financial', permissions: [Permissions.ViewFinancialAnalytics], featureCode: 'REPORTS' },
  { label: 'Trainers', icon: 'sports', route: '/gym-admin/trainers', permissions: [Permissions.ViewTrainers], featureCode: 'TRAINERS' },
  { label: 'Membership Plans', icon: 'card_membership', route: '/gym-admin/membership-plans', permissions: [Permissions.ViewMemberships], featureCode: 'MEMBERSHIPS' },
  { label: 'Memberships', icon: 'event_note', route: '/gym-admin/memberships', permissions: [Permissions.ViewMemberships], featureCode: 'MEMBERSHIPS' },
  { label: 'Payments', icon: 'payments', route: '/gym-admin/payments', permissions: [Permissions.ViewPayments], featureCode: 'PAYMENTS' },
  { label: 'Notifications', icon: 'notifications', route: '/gym-admin/notifications', permissions: [Permissions.ViewNotifications], featureCode: 'NOTIFICATIONS' },
  { label: 'Revenue', icon: 'trending_up', route: '/gym-admin/revenue', permissions: [Permissions.ViewRevenue], featureCode: 'PAYMENTS' },
  { label: 'Attendance', icon: 'event_available', route: '/gym-admin/attendance', permissions: [Permissions.ViewAttendance], featureCode: 'ATTENDANCE' },
  { label: 'Scan QR', icon: 'qr_code_scanner', route: '/gym-admin/attendance/scan-qr', permissions: [Permissions.ManageAttendance], featureCode: 'ATTENDANCE' },
  { label: 'Reception Scanner', icon: 'qr_code_2', route: '/gym-admin/reception/scan', permissions: [Permissions.ManageAttendance], featureCode: 'ATTENDANCE' },
  { label: 'Attendance Reports', icon: 'assessment', route: '/gym-admin/attendance/reports', permissions: [Permissions.ViewAttendance], featureCode: 'ATTENDANCE' },
  { label: 'Audit Logs', icon: 'history', route: '/gym-admin/audit', permissions: [Permissions.ViewAuditLogs] },
  { label: 'Diet Plans', icon: 'restaurant_menu', route: '/gym-admin/diet-plans', permissions: [Permissions.ViewDietPlans], featureCode: 'DIET_PLANS' },
  { label: 'Workout Plans', icon: 'fitness_center', route: '/gym-admin/workout-plans', permissions: [Permissions.ViewWorkoutPlans], featureCode: 'WORKOUT_PLANS' },
  { label: 'Subscription', icon: 'subscriptions', route: '/gym-admin/subscription', permissions: [Permissions.ViewSaasSubscription], featureCode: 'SUBSCRIPTIONS' },
  { label: 'Gym Branding', icon: 'palette', route: '/gym-admin/settings/branding', permissions: [Permissions.ManageGymBranding], featureCode: 'CUSTOM_BRANDING' },
  { label: 'Branches', icon: 'store', route: '/gym-admin/branches', permissions: [Permissions.ViewBranches], featureCode: 'MULTI_BRANCH' },
  { label: 'Branch Dashboard', icon: 'dashboard', route: '/gym-admin/branches/dashboard', permissions: [Permissions.ViewBranches], featureCode: 'MULTI_BRANCH' },
  { label: 'Branch Analytics', icon: 'leaderboard', route: '/gym-admin/branches/analytics', permissions: [Permissions.ViewBranchAnalytics], featureCode: 'MULTI_BRANCH' },
  { label: 'Branch Transfers', icon: 'swap_horiz', route: '/gym-admin/branches/transfers', permissions: [Permissions.ViewBranches], featureCode: 'MULTI_BRANCH' },
  { label: 'Branch Targets', icon: 'flag', route: '/gym-admin/branches/targets', permissions: [Permissions.ViewBranches], featureCode: 'MULTI_BRANCH' },
  { label: 'Mobile Push', icon: 'phonelink_ring', route: '/gym-admin/mobile-notifications', permissions: [Permissions.SendNotifications], featureCode: 'NOTIFICATIONS' },
  { label: 'Mobile Analytics', icon: 'insights', route: '/gym-admin/mobile-analytics', permissions: [Permissions.ViewNotifications], featureCode: 'NOTIFICATIONS' },
  { label: 'AI Dashboard', icon: 'psychology', route: '/gym-admin/ai', permissions: [Permissions.ViewAiInsights], featureCode: 'AI_INSIGHTS' },
  { label: 'AI Insights', icon: 'lightbulb', route: '/gym-admin/ai/insights', permissions: [Permissions.ViewAiInsights], featureCode: 'AI_INSIGHTS' },
  { label: 'Bookings', icon: 'event_available', route: '/gym-admin/bookings', permissions: [Permissions.ViewBookings], featureCode: 'BOOKINGS' },
  { label: 'Class Schedules', icon: 'calendar_month', route: '/gym-admin/schedules', permissions: [Permissions.ManageSchedules], featureCode: 'BOOKINGS' },
  { label: 'Booking Analytics', icon: 'insights', route: '/gym-admin/booking-analytics', permissions: [Permissions.ViewBookingAnalytics], featureCode: 'BOOKINGS' },
  { label: 'Website Builder', icon: 'language', route: '/gym-admin/website-builder', permissions: [Permissions.ViewWebsiteBuilder], featureCode: 'WEBSITE_BUILDER' },
  { label: 'Website Analytics', icon: 'public', route: '/gym-admin/website-builder/analytics', permissions: [Permissions.ViewWebsiteAnalytics], featureCode: 'WEBSITE_BUILDER' },
  { label: 'White Label', icon: 'branding_watermark', route: '/gym-admin/branding', permissions: [Permissions.ViewWhiteLabel], featureCode: 'WHITE_LABEL' },
];

export function filterMenuItems(
  items: AppMenuItem[],
  roles: string[],
  permissions: string[]
): AppMenuItem[] {
  return items.filter((item) => {
    if (item.visible === false) return false;
    if (item.roles?.length && !item.roles.some((r) => roles.includes(r))) return false;
    if (item.permissions?.length && !item.permissions.some((p) => permissions.includes(p))) return false;
    return true;
  });
}

export const TRAINER_MENU: AppMenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/trainer', permissions: [Permissions.ViewDashboard] },
  { label: 'My Members', icon: 'groups', route: '/trainer/members', permissions: [Permissions.ViewMembers] },
  { label: 'Attendance', icon: 'event_available', route: '/trainer/attendance', permissions: [Permissions.ViewAttendance] },
  { label: 'Scan QR', icon: 'qr_code_scanner', route: '/trainer/attendance/scan-qr', permissions: [Permissions.ManageAttendance] },
  { label: 'Workout Plans', icon: 'fitness_center', route: '/trainer/workout-plans', permissions: [Permissions.ViewWorkoutPlans] },
  { label: 'AI Recommendations', icon: 'psychology', route: '/trainer/ai-recommendations', permissions: [Permissions.ViewAiRecommendations] },
  { label: 'My Schedule', icon: 'calendar_month', route: '/trainer/schedule', permissions: [Permissions.ViewBookings], featureCode: 'BOOKINGS' },
  { label: 'Class Bookings', icon: 'event_note', route: '/trainer/bookings', permissions: [Permissions.ViewBookings], featureCode: 'BOOKINGS' },
];

export const MEMBER_MENU: AppMenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/member/dashboard', permissions: [Permissions.ViewMemberDashboard] },
  { label: 'Goals', icon: 'flag', route: '/member/goals', permissions: [Permissions.ManageMemberGoals] },
  { label: 'Progress', icon: 'monitor_weight', route: '/member/progress', permissions: [Permissions.TrackMemberProgress] },
  { label: 'Workouts', icon: 'fitness_center', route: '/member/workouts', permissions: [Permissions.TrackMemberProgress] },
  { label: 'Diet Tracker', icon: 'restaurant', route: '/member/diets', permissions: [Permissions.TrackMemberProgress] },
  { label: 'Water', icon: 'water_drop', route: '/member/water', permissions: [Permissions.TrackMemberProgress] },
  { label: 'Referrals', icon: 'card_giftcard', route: '/member/referrals', permissions: [Permissions.ViewMemberDashboard], visible: MEMBER_PORTAL_MENU_VISIBILITY.referrals },
  { label: 'Feedback', icon: 'rate_review', route: '/member/feedback', permissions: [Permissions.SubmitMemberFeedback] },
  { label: 'My Profile', icon: 'person', route: '/member/profile', permissions: [Permissions.ViewMemberDetails] },
  { label: 'My Diet Plan', icon: 'restaurant_menu', route: '/member/diet', permissions: [Permissions.ViewMemberDiet] },
  { label: 'My Workout Plan', icon: 'sports_gymnastics', route: '/member/workout', permissions: [Permissions.ViewMemberWorkout] },
  { label: 'Pay Membership', icon: 'payments', route: '/member/checkout', permissions: [Permissions.InitiateOnlinePayment], visible: MEMBER_PORTAL_MENU_VISIBILITY.payMembership },
  { label: 'Book a Class', icon: 'event_available', route: '/member/bookings', permissions: [Permissions.ViewBookings], featureCode: 'BOOKINGS' },
];

export function getDefaultRouteForUser(roles: string[]): string {
  if (roles.includes(Roles.SuperAdmin)) return '/super-admin';
  if (roles.includes(Roles.GymAdmin)) return '/gym-admin/dashboard';
  if (roles.includes(Roles.Trainer)) return '/trainer';
  if (roles.includes(Roles.Member)) return '/member/dashboard';
  return '/auth/login';
}