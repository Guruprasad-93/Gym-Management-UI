import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { InAppNotificationService } from '../../core/services/in-app-notification.service';
import { untilDestroyed } from '../../core/utils/destroy-ref.util';
import { UserInAppNotification, UserInAppNotificationsResponse } from '../../shared/models/user-in-app-notification.models';
import { ApiResponse } from '../../core/models/auth.models';
import { Roles } from '../../core/constants/roles';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css',
})
export class NotificationBellComponent implements OnInit {
  private readonly notifications = inject(InAppNotificationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<UserInAppNotification[]>([]);
  readonly open = signal(false);
  readonly unreadCount = this.notifications.unreadCount;

  readonly hasItems = computed(() => this.items().length > 0);

  ngOnInit(): void {
    if (!this.auth.user()?.gymId) return;
    this.notifications.loadNotifications().pipe(untilDestroyed(this.destroyRef)).subscribe((res: ApiResponse<UserInAppNotificationsResponse>) => {
      if (res.success && res.data) {
        this.items.set(res.data.items);
      }
    });
  }

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  onNotificationClick(item: UserInAppNotification): void {
    this.notifications.markRead([item.id]).pipe(untilDestroyed(this.destroyRef)).subscribe(() => {
      this.notifications.refreshUnreadCount();
      this.items.update((current) =>
        current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    });

    if (item.actionRoute && this.auth.hasRole(Roles.GymAdmin)) {
      this.router.navigateByUrl(item.actionRoute);
      this.close();
      return;
    }

    this.close();
  }

  markAllRead(): void {
    this.notifications.markRead().pipe(untilDestroyed(this.destroyRef)).subscribe(() => {
      this.notifications.refreshUnreadCount();
      this.items.update((current) => current.map((n) => ({ ...n, isRead: true })));
    });
  }
}
