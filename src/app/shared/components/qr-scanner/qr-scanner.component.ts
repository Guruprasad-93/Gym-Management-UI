import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  signal,
} from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  template: `
    <div class="qr-scanner">
      @if (error()) {
        <p class="qr-scanner__error">{{ error() }}</p>
      }
      <div #reader class="qr-scanner__reader" id="qr-reader-host"></div>
      @if (!started() && !error()) {
        <p class="qr-scanner__hint">Starting camera…</p>
      }
    </div>
  `,
  styles: `
    .qr-scanner {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }
    .qr-scanner__reader {
      width: min(100%, 360px);
      min-height: 280px;
      border-radius: 12px;
      overflow: hidden;
      background: #0f172a;
    }
    .qr-scanner__reader :global(video) {
      border-radius: 12px;
    }
    .qr-scanner__error {
      color: #b42318;
      margin: 0;
      text-align: center;
    }
    .qr-scanner__hint {
      color: #667085;
      margin: 0;
      font-size: 0.875rem;
    }
  `,
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @ViewChild('reader', { static: true }) readerRef!: ElementRef<HTMLElement>;
  @Output() readonly scanned = new EventEmitter<string>();

  private scanner?: Html5Qrcode;
  private readonly hostId = `qr-reader-${Math.random().toString(36).slice(2, 9)}`;

  readonly started = signal(false);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.readerRef.nativeElement.id = this.hostId;
    this.scanner = new Html5Qrcode(this.hostId);

    try {
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (decoded) => this.scanned.emit(decoded),
        () => undefined
      );
      this.started.set(true);
    } catch {
      try {
        await this.scanner.start(
          { facingMode: 'user' },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          (decoded) => this.scanned.emit(decoded),
          () => undefined
        );
        this.started.set(true);
      } catch {
        this.error.set('Unable to access camera. Use manual entry or check browser permissions.');
      }
    }
  }

  async ngOnDestroy(): Promise<void> {
    if (!this.scanner) return;
    try {
      if (this.scanner.isScanning) await this.scanner.stop();
      await this.scanner.clear();
    } catch {
      /* ignore cleanup errors */
    }
  }
}
