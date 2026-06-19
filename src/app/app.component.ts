import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { BrandingService } from './core/services/branding.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly branding = inject(BrandingService);

  ngOnInit(): void {
    this.branding.applyToDocument();
    const gymId = this.auth.user()?.gymId;
    if (gymId) {
      this.branding.ensureLoaded(gymId);
    }
  }
}
