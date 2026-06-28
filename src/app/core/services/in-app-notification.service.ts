import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import {
  MarkUserInAppNotificationsReadRequest,
  UserInAppNotificationsResponse,
} from '../../shared/models/user-in-app-notification.models';

@Injectable({ providedIn: 'root' })
export class InAppNotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/subscription-notifications`;

  private readonly unreadCountSignal = signal(0);
  readonly unreadCount = this.unreadCountSignal.asReadonly();

  loadNotifications(unreadOnly = false): Observable<ApiResponse<UserInAppNotificationsResponse>> {
    let params = new HttpParams();
    if (unreadOnly) params = params.set('unreadOnly', 'true');

    return this.http
      .get<ApiResponse<UserInAppNotificationsResponse>>(`${this.base}/my`, { params })
      .pipe(tap((res) => {
        if (res.success && res.data) {
          this.unreadCountSignal.set(res.data.unreadCount);
        }
      }));
  }

  markRead(notificationIds?: number[]): Observable<ApiResponse<unknown>> {
    const body: MarkUserInAppNotificationsReadRequest = { notificationIds: notificationIds ?? null };
    return this.http.put<ApiResponse<unknown>>(`${this.base}/read`, body).pipe(
      tap(() => {
        if (!notificationIds?.length) {
          this.unreadCountSignal.set(0);
        }
      })
    );
  }

  refreshUnreadCount(): void {
    this.loadNotifications(true).subscribe();
  }
}
