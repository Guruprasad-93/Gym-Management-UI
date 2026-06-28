export interface UserInAppNotification {
  id: number;
  gymId: string;
  userId: string;
  notificationKey: string;
  notificationType: string;
  title: string;
  message: string;
  severity: string;
  actionRoute?: string | null;
  showLoginPopup: boolean;
  isRead: boolean;
  readDate?: string | null;
  createdDate: string;
}

export interface UserInAppNotificationsResponse {
  items: UserInAppNotification[];
  unreadCount: number;
}

export interface MarkUserInAppNotificationsReadRequest {
  notificationIds?: number[] | null;
}
