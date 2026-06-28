export interface AttendanceStatus {
  attendanceStatusId: number;
  code: string;
  name: string;
  description?: string;
}

export interface MemberAttendance {
  memberAttendanceId: number;
  gymId: string;
  memberId: number;
  memberName: string;
  memberEmail?: string;
  trainerId?: number;
  trainerName?: string;
  attendanceStatusId: number;
  statusCode: string;
  statusName: string;
  attendanceDate: string;
  checkInAt?: string;
  checkOutAt?: string;
  checkoutType?: string;
  isAutoCheckout?: boolean;
  isCurrentlyCheckedIn?: boolean;
  markedByName?: string;
  notes?: string;
  createdAt: string;
}

export interface TrainerAttendance {
  trainerAttendanceId: number;
  gymId: string;
  trainerId: number;
  trainerName: string;
  attendanceStatusId: number;
  statusName: string;
  attendanceDate: string;
  checkInAt?: string;
  checkOutAt?: string;
  notes?: string;
  createdAt: string;
}

export interface AttendanceDashboard {
  totalActiveMembers: number;
  membersPresentToday: number;
  currentlyCheckedIn: number;
  absentToday: number;
  checkedOutToday: number;
  autoCheckedOutToday: number;
  manualCheckOutToday: number;
}

export interface AttendanceQuery {
  fromDate?: string;
  toDate?: string;
  memberId?: number;
  statusId?: number;
  openOnly?: boolean;
  checkoutTypeFilter?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface DailyAttendanceReport {
  reportDate: string;
  statusCounts: { attendanceStatusId: number; statusCode: string; statusName: string; recordCount: number; reportDate: string }[];
  details: { memberAttendanceId: number; memberId: number; memberName: string; statusName: string; checkInAt?: string; checkOutAt?: string; checkoutType?: string; isAutoCheckout?: boolean }[];
}

export interface AttendanceSettings {
  gymId: string;
  openingTime: string;
  closingTime: string;
  autoCheckoutEnabled: boolean;
  useClosingTimeForAutoCheckout: boolean;
  checkoutReminderMinutesBefore: number;
  timeZoneId: string;
  is24Hours: boolean;
  maximumSessionHours: number;
}

export interface UpdateAttendanceSettings {
  openingTime: string;
  closingTime: string;
  autoCheckoutEnabled: boolean;
  useClosingTimeForAutoCheckout: boolean;
  checkoutReminderMinutesBefore: number;
  timeZoneId: string;
  is24Hours: boolean;
  maximumSessionHours: number;
}

export interface ForgotCheckOutReportItem {
  memberId: number;
  memberName: string;
  branchId?: number;
  branchName?: string;
  totalAutoCheckOutCount: number;
  lastAutoCheckOutAt?: string;
  lastAutoCheckOutDate?: string;
}

export interface ForgotCheckOutReportQuery {
  fromDate?: string;
  toDate?: string;
  memberId?: number;
  branchId?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface MonthlyAttendanceReport {
  year: number;
  month: number;
  members: { memberId: number; memberName: string; presentDays: number; absentDays: number; lateDays: number; excusedDays: number; totalRecords: number }[];
}
