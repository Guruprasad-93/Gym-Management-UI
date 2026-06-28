import { DatePipe } from '@angular/common';

import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';

import { Chart, registerables } from 'chart.js';

import { MemberSelfServiceService } from '../../../core/services/member-self-service.service';

import { DietService } from '../../../core/services/diet.service';

import { NotificationService } from '../../../core/services/notification.service';

import { SaasChartCardComponent } from '../../../shared/components/saas-chart-card/saas-chart-card.component';

import { SaasKpiCardComponent } from '../../../shared/components/saas-kpi-card/saas-kpi-card.component';

import { DietComplianceSummary, DietTracking } from '../../../shared/models/member-self-service.models';



Chart.register(...registerables);



@Component({

  selector: 'app-member-diets',

  standalone: true,

  imports: [DatePipe, ReactiveFormsModule, MatIconModule, SaasChartCardComponent, SaasKpiCardComponent],

  templateUrl: './member-diets.component.html',

  styleUrl: './member-diets.component.css',

})

export class MemberDietsComponent implements OnInit, AfterViewInit {

  @ViewChild('chartRef') chartRef?: ElementRef<HTMLCanvasElement>;



  private readonly service = inject(MemberSelfServiceService);

  private readonly dietService = inject(DietService);

  private readonly notify = inject(NotificationService);

  private readonly fb = inject(FormBuilder);

  private chart?: Chart;



  diets = signal<DietTracking[]>([]);

  compliance = signal<DietComplianceSummary | null>(null);

  activePlanId = signal<number | null>(null);

  activePlanName = signal<string | null>(null);

  planLoading = signal(true);



  form = this.fb.group({

    mealsCompleted: [3, Validators.required],

    compliancePercentage: [100, Validators.required],

  });



  ngOnInit(): void {

    this.load();

    this.loadActivePlan();

    this.service.getDietCompliance().subscribe({

      next: (r) => {

        if (r.success) this.compliance.set(r.data ?? null);

      },

    });

  }



  ngAfterViewInit(): void {

    setTimeout(() => this.renderChart(), 0);

  }



  load(): void {

    this.service.getDiets().subscribe({

      next: (r) => {

        if (r.success && r.data) {

          this.diets.set(r.data);

          setTimeout(() => this.renderChart(), 0);

        }

      },

    });

  }



  loadActivePlan(): void {

    this.planLoading.set(true);

    this.dietService.getMyDiet().subscribe({

      next: (r) => {

        this.planLoading.set(false);

        const plan = r.data;

        this.activePlanId.set(plan?.dietPlanId ?? null);

        this.activePlanName.set(plan?.planName ?? null);

      },

      error: () => {

        this.planLoading.set(false);

        this.activePlanId.set(null);

        this.activePlanName.set(null);

        this.notify.error('Failed to load your diet plan');

      },

    });

  }



  save(): void {

    const dietPlanId = this.activePlanId();

    if (!dietPlanId) {

      this.notify.error('No active diet plan is assigned to your account.');

      return;

    }

    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    this.service.upsertDiet({

      dietPlanId,

      mealsCompleted: v.mealsCompleted!,

      compliancePercentage: v.compliancePercentage!,

    }).subscribe({

      next: () => {

        this.notify.success('Diet logged');

        this.load();

      },

      error: () => this.notify.error('Failed to save diet'),

    });

  }



  private renderChart(): void {

    const el = this.chartRef?.nativeElement;

    const data = this.diets();

    if (!el || !data.length) return;

    this.chart?.destroy();

    this.chart = new Chart(el, {

      type: 'line',

      data: {

        labels: data.map((d) => d.trackingDate),

        datasets: [{

          label: 'Compliance %',

          data: data.map((d) => d.compliancePercentage),

          borderColor: '#12b76a',

          backgroundColor: 'rgba(18, 183, 106, 0.12)',

          fill: true,

          tension: 0.35,

        }],

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: { legend: { display: false } },

        scales: { y: { max: 100 } },

      },

    });

  }

}

