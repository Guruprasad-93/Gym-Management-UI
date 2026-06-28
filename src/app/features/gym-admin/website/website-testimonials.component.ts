import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WebsiteService } from '../../../core/services/website.service';
import { DialogService } from '../../../core/services/dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { GymWebsiteTestimonial } from '../../../shared/models/website.models';
import { WebsiteViewLinkComponent } from './website-view-link.component';

@Component({
  selector: 'app-website-testimonials',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, WebsiteViewLinkComponent],
  templateUrl: './website-testimonials.component.html',
  styleUrl: './website-testimonials.component.css',
})
export class WebsiteTestimonialsComponent implements OnInit {
  private readonly service = inject(WebsiteService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  items = signal<GymWebsiteTestimonial[]>([]);
  loading = signal(true);
  saving = signal(false);

  form = this.fb.group({
    memberName: ['', Validators.required],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    reviewText: [''],
    isApproved: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getTestimonials().subscribe({
      next: (r) => {
        this.loading.set(false);
        if (r.success && r.data) this.items.set(r.data);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load testimonials');
      },
    });
  }

  setRating(value: number): void {
    this.form.patchValue({ rating: value });
  }

  stars(rating: number): string {
    return '★'.repeat(Math.min(5, Math.max(0, rating))) + '☆'.repeat(5 - Math.min(5, Math.max(0, rating)));
  }

  create(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.service.createTestimonial(this.form.getRawValue() as never).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success('Testimonial added');
        this.form.reset({ rating: 5, isApproved: true });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Failed to add testimonial');
      },
    });
  }

  toggleApproved(t: GymWebsiteTestimonial): void {
    this.service
      .updateTestimonial(t.id, {
        memberName: t.memberName,
        rating: t.rating,
        reviewText: t.reviewText,
        isApproved: !t.isApproved,
      })
      .subscribe({
        next: () => {
          this.notify.success(t.isApproved ? 'Testimonial unpublished' : 'Testimonial published');
          this.load();
        },
        error: () => this.notify.error('Update failed'),
      });
  }

  remove(id: number): void {
    this.dialog
      .confirm({
        title: 'Delete testimonial',
        message: 'Delete this testimonial?',
        tone: 'danger',
        confirmLabel: 'Delete',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.service.deleteTestimonial(id).subscribe({
          next: () => {
            this.notify.success('Testimonial deleted');
            this.load();
          },
          error: () => this.notify.error('Delete failed'),
        });
      });
  }
}
