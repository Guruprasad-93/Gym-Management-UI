import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpEventType } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, lastValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { FileService } from '../../../core/services/file.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WebsiteService } from '../../../core/services/website.service';
import { FileCategories } from '../../../shared/models/file.models';
import { GymWebsiteGalleryItem } from '../../../shared/models/website.models';
import { WebsiteViewLinkComponent } from './website-view-link.component';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface GalleryUploadTask {
  key: string;
  fileName: string;
  previewUrl: string;
  progress: number;
  status: 'queued' | 'uploading' | 'saving' | 'done' | 'error';
  error?: string;
}

@Component({
  selector: 'app-website-gallery',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    DragDropModule,
    WebsiteViewLinkComponent,
  ],
  templateUrl: './website-gallery.component.html',
  styleUrl: './website-gallery.component.css',
})
export class WebsiteGalleryComponent implements OnInit {
  private readonly website = inject(WebsiteService);
  private readonly files = inject(FileService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);

  gallery = signal<GymWebsiteGalleryItem[]>([]);
  loading = signal(true);
  uploading = signal(false);
  dragOver = signal(false);
  uploadTasks = signal<GalleryUploadTask[]>([]);
  previewItem = signal<GymWebsiteGalleryItem | null>(null);
  reordering = signal(false);

  readonly accept = ACCEPTED_TYPES.join(',');

  private gymId = '';

  ngOnInit(): void {
    this.gymId = this.auth.user()?.gymId ?? '';
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.website.getGallery().subscribe({
      next: (r) => {
        this.loading.set(false);
        if (r.success && r.data) {
          this.gallery.set([...r.data].sort((a, b) => a.displayOrder - b.displayOrder));
        }
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load gallery');
      },
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (files.length) void this.processFiles(files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    if (files.length) void this.processFiles(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  private async processFiles(files: File[]): Promise<void> {
    const imageFiles = files.filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (imageFiles.length !== files.length) {
      this.notify.error('Some files were skipped — only JPG, PNG, WebP, and GIF images are allowed.');
    }
    if (!imageFiles.length) return;

    const invalid = imageFiles.filter((f) => f.size > MAX_IMAGE_BYTES);
    if (invalid.length) {
      this.notify.error(`${invalid.length} file(s) exceed the 5 MB limit and were skipped.`);
    }

    const valid = imageFiles.filter((f) => f.size > 0 && f.size <= MAX_IMAGE_BYTES);
    if (!valid.length) return;

    this.uploading.set(true);
    const startOrder = this.gallery().length;
    let added = 0;

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      const key = `${Date.now()}-${i}-${file.name}`;
      const task: GalleryUploadTask = {
        key,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: 'queued',
      };
      this.uploadTasks.update((tasks) => [...tasks, task]);

      try {
        this.updateTask(key, { status: 'uploading', progress: 5 });
        const stored = await this.uploadFile(file, (pct) => this.updateTask(key, { progress: pct }));

        this.updateTask(key, { status: 'saving', progress: 92 });
        const caption = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        const galleryRes = await lastValueFrom(
          this.website.addGalleryItem({
            fileId: stored.fileId,
            caption,
            displayOrder: startOrder + added,
          })
        );

        if (galleryRes.success && galleryRes.data) {
          this.gallery.update((items) => [...items, galleryRes.data!]);
          added++;
          this.updateTask(key, { status: 'done', progress: 100 });
        } else {
          throw new Error(galleryRes.message ?? 'Failed to add to gallery');
        }
      } catch (err: unknown) {
        const message = (err as { error?: { message?: string }; message?: string })?.error?.message
          ?? (err as Error)?.message
          ?? 'Upload failed';
        this.updateTask(key, { status: 'error', error: message, progress: 0 });
      }
    }

    this.uploading.set(false);
    if (added > 0) {
      this.notify.success(`${added} image${added === 1 ? '' : 's'} added to gallery`);
      this.load();
    }

    setTimeout(() => {
      this.uploadTasks.update((tasks) => tasks.filter((t) => t.status === 'error'));
      for (const task of this.uploadTasks()) {
        if (task.status === 'done') URL.revokeObjectURL(task.previewUrl);
      }
    }, 2500);
  }

  private uploadFile(file: File, onProgress: (pct: number) => void): Promise<{ fileId: number }> {
    return new Promise((resolve, reject) => {
      this.files
        .uploadWithProgress(file, {
          fileCategory: FileCategories.WebsiteGallery,
          gymId: this.gymId || null,
        })
        .subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              const pct = Math.round((event.loaded / event.total) * 85);
              onProgress(Math.min(85, pct));
            } else if (event.type === HttpEventType.Response) {
              if (event.body?.success && event.body.data) {
                resolve({ fileId: event.body.data.fileId });
              } else {
                reject(new Error(event.body?.message ?? 'Upload failed'));
              }
            }
          },
          error: (err) => reject(err),
        });
    });
  }

  private updateTask(key: string, patch: Partial<GalleryUploadTask>): void {
    this.uploadTasks.update((tasks) =>
      tasks.map((t) => (t.key === key ? { ...t, ...patch } : t))
    );
  }

  drop(event: CdkDragDrop<GymWebsiteGalleryItem[]>): void {
    const items = [...this.gallery()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.gallery.set(items);
    this.persistOrder(items);
  }

  private persistOrder(items: GymWebsiteGalleryItem[]): void {
    this.reordering.set(true);
    const updates = items.map((item, index) =>
      this.website.updateGalleryItem(item.id, { caption: item.caption, displayOrder: index })
    );
    forkJoin(updates).subscribe({
      next: () => {
        this.reordering.set(false);
        this.notify.success('Gallery order updated');
      },
      error: () => {
        this.reordering.set(false);
        this.notify.error('Failed to save order');
        this.load();
      },
    });
  }

  saveCaption(item: GymWebsiteGalleryItem, caption: string): void {
    const trimmed = caption.trim();
    if (trimmed === (item.caption ?? '')) return;
    this.website.updateGalleryItem(item.id, { caption: trimmed, displayOrder: item.displayOrder }).subscribe({
      next: () => {
        this.gallery.update((items) =>
          items.map((g) => (g.id === item.id ? { ...g, caption: trimmed } : g))
        );
      },
      error: () => this.notify.error('Failed to update caption'),
    });
  }

  openPreview(item: GymWebsiteGalleryItem): void {
    this.previewItem.set(item);
  }

  closePreview(): void {
    this.previewItem.set(null);
  }

  remove(item: GymWebsiteGalleryItem): void {
    this.dialog
      .confirm({
        title: 'Remove image',
        message: 'Remove this image from the gallery?',
        tone: 'danger',
        confirmLabel: 'Remove',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.website.deleteGalleryItem(item.id).subscribe({
          next: () => {
            this.gallery.update((items) => items.filter((g) => g.id !== item.id));
            this.notify.success('Image removed');
          },
          error: () => this.notify.error('Remove failed'),
        });
      });
  }
}
