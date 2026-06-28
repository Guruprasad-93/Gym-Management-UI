import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { PagedResult } from '../../shared/models/paged.models';
import { AvailableSlot, BookingAnalytics, BookingSettings, ClassSchedule, CreateClassScheduleRequest, SlotBooking, TrainerScheduleItem, UpdateClassScheduleRequest } from '../../shared/models/booking.models';
import { QrScanResult } from '../../shared/models/qr-checkin.models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly bookingsBase = `${environment.apiUrl}/bookings`;
  private readonly schedulesBase = `${environment.apiUrl}/schedules`;
  private readonly analyticsBase = `${environment.apiUrl}/booking-analytics`;
  private readonly trainerBase = `${environment.apiUrl}/trainer-schedule`;
  private readonly checkInBase = `${environment.apiUrl}/booking-checkin`;

  getAvailableSlots(fromDate: string, toDate: string, branchId?: number): Observable<ApiResponse<AvailableSlot[]>> {
    let params = new HttpParams().set('fromDate', fromDate).set('toDate', toDate);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<AvailableSlot[]>>(`${this.bookingsBase}/available-slots`, { params });
  }

  book(classScheduleId: number, bookingDate: string): Observable<ApiResponse<SlotBooking>> {
    return this.http.post<ApiResponse<SlotBooking>>(`${this.bookingsBase}/book`, { classScheduleId, bookingDate });
  }

  cancel(bookingId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.bookingsBase}/cancel`, { bookingId });
  }

  joinWaitlist(classScheduleId: number, bookingDate: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.bookingsBase}/waitlist`, { classScheduleId, bookingDate });
  }

  getBookings(pageNumber = 1, pageSize = 20, status?: string): Observable<ApiResponse<PagedResult<SlotBooking>>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<PagedResult<SlotBooking>>>(this.bookingsBase, { params });
  }

  getSchedules(pageNumber = 1, pageSize = 50): Observable<ApiResponse<PagedResult<ClassSchedule>>> {
    const params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    return this.http.get<ApiResponse<PagedResult<ClassSchedule>>>(this.schedulesBase, { params });
  }

  getSchedule(id: number): Observable<ApiResponse<ClassSchedule>> {
    return this.http.get<ApiResponse<ClassSchedule>>(`${this.schedulesBase}/${id}`);
  }

  createSchedule(dto: CreateClassScheduleRequest): Observable<ApiResponse<ClassSchedule>> {
    return this.http.post<ApiResponse<ClassSchedule>>(this.schedulesBase, dto);
  }

  updateSchedule(id: number, dto: UpdateClassScheduleRequest): Observable<ApiResponse<ClassSchedule>> {
    return this.http.put<ApiResponse<ClassSchedule>>(`${this.schedulesBase}/${id}`, dto);
  }

  deleteSchedule(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.schedulesBase}/${id}`);
  }

  getSettings(): Observable<ApiResponse<BookingSettings>> {
    return this.http.get<ApiResponse<BookingSettings>>(`${this.bookingsBase}/settings`);
  }

  updateSettings(dto: Omit<BookingSettings, 'gymId'>): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.bookingsBase}/settings`, dto);
  }

  getAnalytics(days = 30, branchId?: number): Observable<ApiResponse<BookingAnalytics>> {
    let params = new HttpParams().set('days', days);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<BookingAnalytics>>(this.analyticsBase, { params });
  }

  exportReport(format: 'pdf' | 'excel', reportType: string): Observable<Blob> {
    return this.http.get(`${this.analyticsBase}/export/${format}`, {
      params: new HttpParams().set('reportType', reportType).set('pageNumber', 1).set('pageSize', 5000),
      responseType: 'blob',
    });
  }

  getTrainerSchedule(fromDate: string, toDate: string): Observable<ApiResponse<TrainerScheduleItem[]>> {
    const params = new HttpParams().set('fromDate', fromDate).set('toDate', toDate);
    return this.http.get<ApiResponse<TrainerScheduleItem[]>>(this.trainerBase, { params });
  }

  checkIn(qrPayload: string): Observable<ApiResponse<QrScanResult>> {
    return this.http.post<ApiResponse<QrScanResult>>(this.checkInBase, { qrPayload });
  }
}
