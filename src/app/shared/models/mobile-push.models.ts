export interface PushNotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  totalPending: number;
  activeDevices: number;
  byType: PushNotificationTypeStat[];
}

export interface PushNotificationTypeStat {
  notificationType: string;
  count: number;
  failedCount: number;
}

export interface PushCampaignHistory {
  notificationType: string;
  title: string;
  message: string;
  sentDate: string;
  recipientCount: number;
  failedCount: number;
  sentCount: number;
}

export type PushCampaignAudience =
  | 'AllMembers'
  | 'ActiveMembers'
  | 'ExpiringMembers'
  | 'SelectedMembers';

export interface PushCampaignAudienceOption {
  value: PushCampaignAudience;
  label: string;
  description: string;
}

export interface SendPushCampaign {
  title: string;
  message: string;
  targetAudience: PushCampaignAudience;
  userIds?: string[];
  branchId?: number;
  expiringWithinDays?: number;
}

export const PushCampaignAudienceOptions: PushCampaignAudienceOption[] = [
  {
    value: 'AllMembers',
    label: 'All Members',
    description: 'Every member with the app installed (includes inactive members)',
  },
  {
    value: 'ActiveMembers',
    label: 'Active Members',
    description: 'Members marked active who have a registered device',
  },
  {
    value: 'ExpiringMembers',
    label: 'Expiring Members',
    description: 'Active memberships ending within the next 30 days',
  },
  {
    value: 'SelectedMembers',
    label: 'Selected Members',
    description: 'Pick specific members from a searchable list',
  },
];

export const PushTemplates = [
  { title: 'Membership Reminder', message: 'Your membership is expiring soon. Renew today to stay active!' },
  { title: 'New Workout Plan', message: 'Your trainer assigned a new workout plan. Open the app to view it.' },
  { title: 'Special Offer', message: 'Limited time offer — visit the front desk or renew in the app.' },
];
