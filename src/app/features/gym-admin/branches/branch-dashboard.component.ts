import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BranchService } from '../../../core/services/branch.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BranchDashboardItem } from '../../../shared/models/branch.models';

interface DashboardTotals {
  memberCount: number;
  trainerCount: number;
  revenueMonth: number;
  expensesMonth: number;
  profitMonth: number;
  attendanceMonth: number;
  leadsOpen: number;
}

@Component({
  selector: 'app-branch-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule, CurrencyPipe],
  templateUrl: './branch-dashboard.component.html',
  styleUrl: './branch-dashboard.component.css',
})
export class BranchDashboardComponent implements OnInit {
  private readonly service = inject(BranchService);
  private readonly notify = inject(NotificationService);

  loading = signal(true);
  items = signal<BranchDashboardItem[]>([]);

  totals = computed<DashboardTotals>(() => {
    const list = this.items();
    return list.reduce<DashboardTotals>(
      (acc, b) => ({
        memberCount: acc.memberCount + b.memberCount,
        trainerCount: acc.trainerCount + b.trainerCount,
        revenueMonth: acc.revenueMonth + b.revenueMonth,
        expensesMonth: acc.expensesMonth + b.expensesMonth,
        profitMonth: acc.profitMonth + b.profitMonth,
        attendanceMonth: acc.attendanceMonth + b.attendanceMonth,
        leadsOpen: acc.leadsOpen + b.leadsOpen,
      }),
      {
        memberCount: 0,
        trainerCount: 0,
        revenueMonth: 0,
        expensesMonth: 0,
        profitMonth: 0,
        attendanceMonth: 0,
        leadsOpen: 0,
      }
    );
  });

  ngOnInit(): void {
    this.service.getDashboard().subscribe({
      next: (r) => {
        this.loading.set(false);
        if (r.success && r.data) this.items.set(r.data);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load branch dashboard');
      },
    });
  }
}
