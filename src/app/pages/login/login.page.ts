import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
} from 'ionicons/icons';
import {
  finalize,
  TimeoutError,
} from 'rxjs';

import { MailAuthService } from '../../core/auth/mail-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
  ],
})
export class LoginPage {
  private readonly auth = inject(MailAuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    addIcons({
      arrowForwardOutline,
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      mailOutline,
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    const email = this.email
      .trim()
      .toLowerCase();

    if (!email || !this.password) {
      this.errorMessage.set(
        'Enter your email address and password.',
      );

      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.auth
      .login(email, this.password)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.password = '';

          void this.router.navigateByUrl(
            '/home',
            {
              replaceUrl: true,
            },
          );
        },

        error: (error: unknown) => {
          this.handleLoginError(error);
        },
      });
  }

  private handleLoginError(error: unknown): void {
    if (error instanceof TimeoutError) {
      this.errorMessage.set(
        'The mail server is taking too long to respond. Please try again.',
      );

      return;
    }

    if (!(error instanceof HttpErrorResponse)) {
      this.errorMessage.set(
        'Unable to sign in right now. Please try again.',
      );

      return;
    }

    if (error.status === 0) {
      this.errorMessage.set(
        'Unable to reach the mail server. Check your connection and try again.',
      );

      return;
    }

    if (error.status === 422) {
      this.errorMessage.set(
        error.error?.errors?.email?.[0] ??
        'The email address or password is incorrect.',
      );

      return;
    }

    if (error.status === 403) {
      this.errorMessage.set(
        error.error?.message ??
        'This mail account is not available.',
      );

      return;
    }

    if (error.status === 419) {
      this.errorMessage.set(
        'Your secure session expired. Please try signing in again.',
      );

      return;
    }

    if (error.status === 429) {
      this.errorMessage.set(
        'Too many sign-in attempts. Please wait a moment and try again.',
      );

      return;
    }

    if (error.status >= 500) {
      this.errorMessage.set(
        'The mail service is temporarily unavailable. Please try again shortly.',
      );

      return;
    }

    this.errorMessage.set(
      'Unable to sign in right now. Please try again.',
    );
  }
}
