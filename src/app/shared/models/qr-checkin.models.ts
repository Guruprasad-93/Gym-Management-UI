export interface QrScanResult {
  attendanceId?: number;
  bookingId?: number;
  memberId: number;
  memberName: string;
  membershipStatus?: string;
  membershipPlanName?: string;
  bookingStatus?: string;
  className?: string;
}

export type QrScanMode = 'attendance' | 'booking' | 'reception';
