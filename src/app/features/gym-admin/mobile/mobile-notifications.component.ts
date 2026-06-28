import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MobilePushService } from '../../../core/services/mobile-push.service';
import { MemberService } from '../../../core/services/member.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Member } from '../../../shared/models/member.models';
import {
  PushCampaignAudience,
  PushCampaignAudienceOptions,
  PushTemplates,
} from '../../../shared/models/mobile-push.models';

@Component({
  selector: 'app-mobile-notifications',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './mobile-notifications.component.html',
  styleUrl: './mobile-notifications.component.css',
})
export class MobileNotificationsComponent implements OnInit {
  private readonly svc = inject(MobilePushService);
  private readonly membersSvc = inject(MemberService);
  private readonly notify = inject(NotificationService);

  readonly audienceOptions = PushCampaignAudienceOptions;
  templates = PushTemplates;
  selectedTemplateTitle = PushTemplates[0].title;
  title = '';
  message = '';
  targetAudience: PushCampaignAudience = 'ActiveMembers';
  selectedUserIds = signal<string[]>([]);
  members = signal<Member[]>([]);
  loadingMembers = signal(false);
  sending = signal(false);
  memberSearchControl = new FormControl('', { nonNullable: true });

  filteredMembers = computed(() => {
    const q = this.memberSearchControl.value.trim().toLowerCase();
    const items = this.members();
    if (!q) return items;
    return items.filter((m) => {
      const haystack = [m.fullName, m.email, m.phone, String(m.id)].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  });

  selectedCount = computed(() => this.selectedUserIds().length);

  ngOnInit(): void {
    this.applyTemplate();
    this.loadMembers();
  }

  applyTemplate(): void {
    const template = this.templates.find((t) => t.title === this.selectedTemplateTitle) ?? this.templates[0];
    this.title = template.title;
    this.message = template.message;
  }

  loadMembers(): void {
    this.loadingMembers.set(true);
    this.membersSvc.getAll(null, false).subscribe({
      next: (items) => {
        this.members.set(items);
        this.loadingMembers.set(false);
      },
      error: () => {
        this.loadingMembers.set(false);
        this.notify.error('Failed to load members');
      },
    });
  }

  isSelected(userId: string): boolean {
    return this.selectedUserIds().includes(userId);
  }

  toggleMember(userId: string): void {
    const current = this.selectedUserIds();
    this.selectedUserIds.set(
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  }

  selectAllVisible(): void {
    const visibleIds = this.filteredMembers().map((m) => m.userId);
    const merged = new Set([...this.selectedUserIds(), ...visibleIds]);
    this.selectedUserIds.set([...merged]);
  }

  clearSelection(): void {
    this.selectedUserIds.set([]);
  }

  audienceHint(): string {
    return this.audienceOptions.find((o) => o.value === this.targetAudience)?.description ?? '';
  }

  canSend(): boolean {
    if (!this.title.trim() || !this.message.trim()) return false;
    if (this.targetAudience === 'SelectedMembers' && this.selectedUserIds().length === 0) return false;
    return true;
  }

  send(): void {
    if (!this.canSend()) return;

    this.sending.set(true);
    this.svc
      .sendCampaign({
        title: this.title.trim(),
        message: this.message.trim(),
        targetAudience: this.targetAudience,
        userIds: this.targetAudience === 'SelectedMembers' ? this.selectedUserIds() : undefined,
        expiringWithinDays: this.targetAudience === 'ExpiringMembers' ? 30 : undefined,
      })
      .subscribe({
        next: (res) => {
          this.sending.set(false);
          this.notify.success(res.message ?? 'Campaign sent.');
          if (this.targetAudience === 'SelectedMembers') {
            this.selectedUserIds.set([]);
          }
        },
        error: (err) => {
          this.sending.set(false);
          this.notify.error(err.error?.message ?? 'Failed to send campaign.');
        },
      });
  }
}
