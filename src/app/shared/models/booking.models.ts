export interface ClassSchedule {
  id: number;
  gymId: string;
  branchId: number;
  branchName: string;
  className: string;
  description?: string;
  trainerId: number;
  trainerName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  status: string;
  createdDate: string;
}

export interface CreateClassScheduleRequest {
  branchId: number;
  className: string;
  description?: string;
  trainerId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface UpdateClassScheduleRequest extends CreateClassScheduleRequest {
  id: number;
  status: string;
}

export interface BookingSettings {
  gymId: string;
  maxBookingsPerDay: number;
  allowWaitlist: boolean;
  cancellationWindowHours: number;
  reminderMinutesBefore: number;
}

export interface AvailableSlot {
  classScheduleId: number;
  gymId: string;
  branchId: number;
  branchName: string;
  className: string;
  description?: string;
  trainerId: number;
  trainerName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remainingCapacity: number;
  waitlistCount: number;
}

export interface SlotBooking {
  id: number;
  gymId: string;
  branchId: number;
  branchName: string;
  memberId: number;
  memberName: string;
  classScheduleId: number;
  className: string;
  startTime: string;
  endTime: string;
  bookingDate: string;
  status: string;
  checkInTime?: string;
  createdDate: string;
  trainerName: string;
}

export interface BookingAnalytics {
  totalBookings: number;
  todaysBookings: number;
  occupancyPercent: number;
  noShowPercent: number;
  cancellationPercent: number;
  bookingTrend: { label: string; bookingCount: number }[];
  popularClasses: { label: string; bookingCount: number }[];
  peakHours: { label: string; bookingCount: number }[];
  branchComparison: { label: string; bookingCount: number }[];
}

export interface TrainerScheduleItem {
  classScheduleId: number;
  className: string;
  branchId: number;
  branchName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  status: string;
  bookingCount: number;
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function bookingStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Booked':
    case 'CheckedIn':
      return 'status-badge--confirmed';
    case 'Completed':
      return 'status-badge--completed';
    case 'Cancelled':
      return 'status-badge--cancelled';
    case 'NoShow':
      return 'status-badge--noshow';
    default:
      return 'status-badge--muted';
  }
}

export function canCancelBooking(status: string): boolean {
  return status === 'Booked';
}
