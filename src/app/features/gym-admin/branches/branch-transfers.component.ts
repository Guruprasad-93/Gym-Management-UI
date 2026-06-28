import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { BranchService } from '../../../core/services/branch.service';
import { MemberService } from '../../../core/services/member.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TrainerService } from '../../../core/services/trainer.service';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../../shared/components/searchable-select/searchable-select.component';
import { Branch, BranchTransfer } from '../../../shared/models/branch.models';
import { Member } from '../../../shared/models/member.models';
import { Trainer } from '../../../shared/models/trainer.models';

@Component({
  selector: 'app-branch-transfers',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    SearchableSelectComponent,
  ],
  templateUrl: './branch-transfers.component.html',
  styleUrl: './branch-transfers.component.css',
})
export class BranchTransfersComponent implements OnInit {
  private readonly service = inject(BranchService);
  private readonly membersSvc = inject(MemberService);
  private readonly trainersSvc = inject(TrainerService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  branches = signal<Branch[]>([]);
  history = signal<BranchTransfer[]>([]);
  members = signal<Member[]>([]);
  trainers = signal<Trainer[]>([]);
  loadingEntities = signal(false);
  loadingHistory = signal(true);
  transferring = signal(false);

  historyCols = ['date', 'entity', 'route'];

  form = this.fb.group({
    type: ['Member', Validators.required],
    selectedPersonId: [null as number | null, [Validators.required, Validators.min(1)]],
    toBranchId: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  personOptions(): SearchableSelectOption[] {
    if (this.form.get('type')?.value === 'Trainer') {
      return this.trainers()
        .map((t) => ({
          value: t.id,
          label: t.fullName?.trim() || t.email?.trim() || `Trainer #${t.id}`,
          hint: [t.email, t.specialization, `ID ${t.id}`].filter(Boolean).join(' · '),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return this.members()
      .map((m) => ({
        value: m.id,
        label: m.fullName,
        hint: [m.phone, m.email, `ID ${m.id}`, m.membershipPlanName].filter(Boolean).join(' · '),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  ngOnInit(): void {
    this.service.getList().subscribe({
      next: (r) => {
        if (r.success && r.data) this.branches.set(r.data);
      },
    });
    this.loadHistory();
    this.loadEntities();
    this.form.get('type')?.valueChanges.subscribe(() => {
      this.form.patchValue({ selectedPersonId: null });
      this.loadEntities();
    });
  }

  entityTypeLabel(): string {
    return this.form.get('type')?.value === 'Trainer' ? 'Trainer' : 'Member';
  }

  setType(type: 'Member' | 'Trainer'): void {
    if (this.form.get('type')?.value === type) return;
    this.form.patchValue({ type, selectedPersonId: null });
    this.loadEntities();
  }

  loadEntities(): void {
    const isTrainer = this.form.get('type')?.value === 'Trainer';
    this.loadingEntities.set(true);

    if (isTrainer) {
      this.trainersSvc.getAll(null, false).subscribe({
        next: (items: Trainer[]) => {
          this.trainers.set(items);
          this.loadingEntities.set(false);
        },
        error: () => {
          this.loadingEntities.set(false);
          this.notify.error('Failed to load trainers');
        },
      });
      return;
    }

    this.membersSvc.getAll(null, false).subscribe({
      next: (items: Member[]) => {
        this.members.set(items);
        this.loadingEntities.set(false);
      },
      error: () => {
        this.loadingEntities.set(false);
        this.notify.error('Failed to load members');
      },
    });
  }

  transfer(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const memberId = Number(v.selectedPersonId);
    const toBranchId = Number(v.toBranchId);
    if (!Number.isFinite(memberId) || memberId < 1 || !Number.isFinite(toBranchId) || toBranchId < 1) {
      this.notify.error('Please select a valid member and destination branch');
      return;
    }
    this.transferring.set(true);
    const req =
      v.type === 'Trainer'
        ? this.service.transferTrainer({ trainerId: memberId, toBranchId })
        : this.service.transferMember({ memberId, toBranchId });
    req.subscribe({
      next: () => {
        this.transferring.set(false);
        this.notify.success(`${this.entityTypeLabel()} transferred successfully`);
        this.form.patchValue({ selectedPersonId: null, toBranchId: null });
        this.loadHistory();
      },
      error: (err) => {
        this.transferring.set(false);
        this.notify.error(err.error?.message ?? 'Transfer failed');
      },
    });
  }

  loadHistory(): void {
    this.loadingHistory.set(true);
    this.service.getTransfers().subscribe({
      next: (r) => {
        this.loadingHistory.set(false);
        if (r.success && r.data) this.history.set(r.data.items);
      },
      error: () => {
        this.loadingHistory.set(false);
        this.notify.error('Failed to load transfer history');
      },
    });
  }
}
