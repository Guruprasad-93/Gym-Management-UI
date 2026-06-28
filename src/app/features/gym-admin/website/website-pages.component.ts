import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WebsiteService } from '../../../core/services/website.service';
import { DialogService } from '../../../core/services/dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { GymWebsitePage } from '../../../shared/models/website.models';
import { WebsiteViewLinkComponent } from './website-view-link.component';

@Component({
  selector: 'app-website-pages',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule, WebsiteViewLinkComponent],
  templateUrl: './website-pages.component.html',
  styleUrl: './website-pages.component.css',
})
export class WebsitePagesComponent implements OnInit {
  private readonly service = inject(WebsiteService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  pages = signal<GymWebsitePage[]>([]);
  loading = signal(true);
  saving = signal(false);

  form = this.fb.group({
    pageName: ['', Validators.required],
    slug: ['', Validators.required],
    pageContent: [''],
    displayOrder: [0],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getPages().subscribe({
      next: (r) => {
        this.loading.set(false);
        if (r.success && r.data) this.pages.set(r.data);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load pages');
      },
    });
  }

  create(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.service.createPage(this.form.getRawValue() as never).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success('Page created');
        this.form.reset({ displayOrder: 0 });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Failed to create page');
      },
    });
  }

  remove(id: number): void {
    this.dialog
      .confirm({
        title: 'Delete page',
        message: 'Delete this page permanently?',
        tone: 'danger',
        confirmLabel: 'Delete',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.service.deletePage(id).subscribe({
          next: () => {
            this.notify.success('Page deleted');
            this.load();
          },
          error: () => this.notify.error('Delete failed'),
        });
      });
  }
}
