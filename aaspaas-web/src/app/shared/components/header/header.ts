
import { Component, inject } from '@angular/core';
import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly authSession = inject(AuthSessionService);

  logout(): void {
    this.authSession.logout();
  }
}
