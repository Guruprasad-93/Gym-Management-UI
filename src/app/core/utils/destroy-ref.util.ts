import { DestroyRef } from '@angular/core';
import { MonoTypeOperatorFunction } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/** Use with `inject(DestroyRef)` in a component field initializer. */
export function untilDestroyed<T>(destroyRef: DestroyRef): MonoTypeOperatorFunction<T> {
  return takeUntilDestroyed<T>(destroyRef);
}
