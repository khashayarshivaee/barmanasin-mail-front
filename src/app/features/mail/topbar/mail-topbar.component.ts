import {
  Component,
  DestroyRef, effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  chevronDownOutline,
  logOutOutline,
  searchOutline,
} from 'ionicons/icons';

import {
  MailAuthService,
} from '../../../core/auth/mail-auth.service';


@Component({
  selector: 'app-mail-topbar',
  standalone: true,
  templateUrl: './mail-topbar.component.html',
  styleUrls: ['./mail-topbar.component.scss'],
  imports: [
    FormsModule,
    IonIcon,
    RouterLink,
  ],
})
export class MailTopbarComponent {
  private readonly authService =
    inject(MailAuthService);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly elementRef =
    inject<ElementRef<HTMLElement>>(ElementRef);

  readonly userName = input<string>('');
  readonly mailboxAddress = input<string>('');

  readonly searchClick = output<void>();
  readonly accountClick = output<void>();

  readonly avatarUrl =
    input<string | null>(null);

  readonly avatarFailed =
    signal(false);

  readonly searchQuery = signal('');

  readonly isAccountOpen = signal(false);
  readonly isLoggingOut = signal(false);
  readonly logoutError = signal('');


  constructor() {
    addIcons({
      chevronDownOutline,
      logOutOutline,
      searchOutline,
    });

    effect(() => {
      this.avatarUrl();
      this.avatarFailed.set(false);
    });
  }


  openSearch(): void {
    this.searchClick.emit();
  }


  openAccount(): void {
    if (this.isLoggingOut()) {
      return;
    }

    const opening = !this.isAccountOpen();

    this.isAccountOpen.set(opening);

    if (opening) {
      this.logoutError.set('');
      this.accountClick.emit();
    }
  }


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      !this.isAccountOpen() ||
      this.isLoggingOut()
    ) {
      return;
    }

    const target = event.target;

    const account =
      this.elementRef.nativeElement
        .querySelector('.mail-topbar__account');

    if (
      target instanceof Node &&
      !account?.contains(target)
    ) {
      this.isAccountOpen.set(false);
    }
  }


  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.isAccountOpen()) {
      return;
    }

    this.isAccountOpen.set(false);

    this.elementRef.nativeElement
      .querySelector<HTMLButtonElement>(
        '.account-button',
      )
      ?.focus();
  }


  logout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.logoutError.set('');

    this.authService
      .logout()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.returnToLogin();
        },

        error: (error) => {
          // The session has already expired.
          if (error.status === 401) {
            this.returnToLogin();
            return;
          }

          console.error(
            '[Mail] Unable to log out.',
            error,
          );

          this.isLoggingOut.set(false);
          this.isAccountOpen.set(true);

          this.logoutError.set(
            'Unable to log out. Please try again.',
          );
        },
      });
  }


  initials(): string {
    const source =
      this.userName().trim() ||
      this.mailboxAddress().trim();

    if (!source) {
      return 'BM';
    }

    const parts = source
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return (
        parts[0][0] +
        parts[1][0]
      ).toUpperCase();
    }

    return source
      .slice(0, 2)
      .toUpperCase();
  }


  private returnToLogin(): void {
    // Reload the app to discard account-specific
    // data held by Angular services.
    window.location.replace('/');
  }
}
