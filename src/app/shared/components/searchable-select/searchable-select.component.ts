import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  forwardRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectionPositionPair,
  Overlay,
  OverlayModule,
} from '@angular/cdk/overlay';
import { ControlValueAccessor, FormBuilder, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface SearchableSelectOption {
  value: number;
  label: string;
  hint?: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    OverlayModule,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="searchable-select" [class.searchable-select--open]="open()" [class.searchable-select--disabled]="disabled">
      <label class="searchable-select__label">{{ label }}</label>
      <button
        #triggerBtn
        type="button"
        class="searchable-select__trigger"
        cdkOverlayOrigin
        #triggerOrigin="cdkOverlayOrigin"
        [disabled]="disabled || loading"
        (click)="toggle($event)"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox">
        @if (loading) {
          <mat-spinner diameter="18" />
          <span>Loading…</span>
        } @else if (selectedOption()) {
          <span class="searchable-select__value">
            <strong>{{ selectedOption()!.label }}</strong>
            @if (selectedOption()!.hint) {
              <small>{{ selectedOption()!.hint }}</small>
            }
          </span>
        } @else {
          <span class="searchable-select__placeholder">{{ placeholder }}</span>
        }
        <mat-icon class="searchable-select__chevron">expand_more</mat-icon>
      </button>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="triggerOrigin"
        [cdkConnectedOverlayOpen]="open()"
        [cdkConnectedOverlayPositions]="positions"
        [cdkConnectedOverlayWidth]="overlayWidth() || 280"
        [cdkConnectedOverlayMinWidth]="overlayWidth() || 280"
        [cdkConnectedOverlayScrollStrategy]="scrollStrategy"
        [cdkConnectedOverlayPush]="true"
        [cdkConnectedOverlayFlexibleDimensions]="true"
        [cdkConnectedOverlayViewportMargin]="8"
        [cdkConnectedOverlayPanelClass]="panelClass"
        (overlayOutsideClick)="close()"
        (detach)="close()">
        <div class="searchable-select__panel" role="listbox">
          <div class="searchable-select__search" (click)="$event.stopPropagation()">
            <mat-icon>search</mat-icon>
            <input
              #searchInput
              type="search"
              [formControl]="searchControl"
              [placeholder]="searchPlaceholder"
              autocomplete="off"
              (keydown.escape)="close()" />
          </div>
          <ul class="searchable-select__list">
            @for (opt of filteredOptions(); track opt.value) {
              <li>
                <button
                  type="button"
                  class="searchable-select__option"
                  [class.searchable-select__option--selected]="opt.value === value"
                  role="option"
                  [attr.aria-selected]="opt.value === value"
                  (click)="pick(opt, $event)">
                  <span class="searchable-select__option-text">
                    <strong>{{ opt.label }}</strong>
                    @if (opt.hint) {
                      <small>{{ opt.hint }}</small>
                    }
                  </span>
                  @if (opt.value === value) {
                    <mat-icon>check</mat-icon>
                  }
                </button>
              </li>
            } @empty {
              <li class="searchable-select__empty">{{ emptyMessage }}</li>
            }
          </ul>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .searchable-select {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        width: 100%;
        overflow: visible;
      }

      .searchable-select__label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #667085;
      }

      .searchable-select__trigger {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        min-height: 44px;
        padding: 0.55rem 0.75rem;
        border: 1px solid #e4e7ec;
        border-radius: 10px;
        background: #fff;
        color: #101828;
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .searchable-select__trigger:hover:not(:disabled) {
        border-color: #d0d5dd;
      }

      .searchable-select--open .searchable-select__trigger,
      .searchable-select__trigger:focus-visible {
        border-color: var(--brand-primary, #ff6600);
        box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.12);
        outline: none;
      }

      .searchable-select--disabled .searchable-select__trigger {
        opacity: 0.6;
        cursor: not-allowed;
        background: #f9fafb;
      }

      .searchable-select__value,
      .searchable-select__placeholder {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .searchable-select__value strong,
      .searchable-select__placeholder {
        font-size: 0.875rem;
      }

      .searchable-select__placeholder {
        color: #98a2b3;
      }

      .searchable-select__value small {
        font-size: 0.75rem;
        color: #667085;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .searchable-select__chevron {
        flex-shrink: 0;
        color: #667085;
        transition: transform 0.15s ease;
      }

      .searchable-select--open .searchable-select__chevron {
        transform: rotate(180deg);
      }

      .searchable-select__panel {
        width: 100%;
        background: #fff;
        border: 1px solid #e4e7ec;
        border-radius: 12px;
        box-shadow: 0 16px 40px rgba(16, 24, 40, 0.16);
        overflow: hidden;
      }

      .searchable-select__search {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 0.75rem;
        border-bottom: 1px solid #f2f4f7;
        background: #fafbfc;
      }

      .searchable-select__search mat-icon {
        color: #667085;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .searchable-select__search input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 0.875rem;
        color: #101828;
      }

      .searchable-select__search input::placeholder {
        color: #98a2b3;
      }

      .searchable-select__list {
        list-style: none;
        margin: 0;
        padding: 0.35rem;
        max-height: min(280px, 50vh);
        overflow-y: auto;
      }

      .searchable-select__option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        width: 100%;
        padding: 0.55rem 0.65rem;
        border: none;
        border-radius: 8px;
        background: transparent;
        text-align: left;
        cursor: pointer;
      }

      .searchable-select__option:hover,
      .searchable-select__option--selected {
        background: rgba(255, 102, 0, 0.08);
      }

      .searchable-select__option mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--brand-primary, #ff6600);
      }

      .searchable-select__option-text {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        min-width: 0;
      }

      .searchable-select__option-text strong {
        font-size: 0.875rem;
        color: #101828;
      }

      .searchable-select__option-text small {
        font-size: 0.75rem;
        color: #667085;
      }

      .searchable-select__empty {
        padding: 1rem 0.75rem;
        text-align: center;
        font-size: 0.8125rem;
        color: #667085;
      }
    `,
  ],
})
export class SearchableSelectComponent implements ControlValueAccessor, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly overlay = inject(Overlay);

  @Input({ required: true }) label = 'Select';
  @Input() placeholder = 'Select an option';
  @Input() searchPlaceholder = 'Search…';
  @Input() emptyMessage = 'No matches found';
  @Input() loading = false;
  @Input() set options(value: SearchableSelectOption[]) {
    this._options = value ?? [];
  }
  get options(): SearchableSelectOption[] {
    return this._options;
  }

  readonly panelClass = 'searchable-select-overlay-pane';
  readonly scrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly positions: ConnectionPositionPair[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -4,
    },
  ];

  private _options: SearchableSelectOption[] = [];
  private searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private triggerBtn = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');

  open = signal(false);
  overlayWidth = signal(0);
  searchControl = this.fb.control('');
  value: number | null = null;
  disabled = false;

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnDestroy(): void {
    this.close();
  }

  writeValue(value: number | null): void {
    this.value = value == null ? null : Number(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.close();
  }

  selectedOption(): SearchableSelectOption | null {
    if (this.value == null) return null;
    return this._options.find((o) => o.value === this.value) ?? null;
  }

  filteredOptions(): SearchableSelectOption[] {
    const q = (this.searchControl.value ?? '').trim().toLowerCase();
    if (!q) return this._options;
    return this._options.filter((opt) => {
      const haystack = `${opt.label} ${opt.hint ?? ''} ${opt.value}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled || this.loading) return;
    if (this.open()) {
      this.close();
      return;
    }
    const width = this.triggerBtn()?.nativeElement.getBoundingClientRect().width;
    this.overlayWidth.set(width && width > 0 ? width : 280);
    this.open.set(true);
    this.searchControl.setValue('');
    this.onTouched();
    queueMicrotask(() => this.searchInput()?.nativeElement.focus());
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.searchControl.setValue('');
  }

  pick(option: SearchableSelectOption, event: MouseEvent): void {
    event.stopPropagation();
    this.value = option.value;
    this.onChange(option.value);
    this.onTouched();
    this.close();
  }
}
