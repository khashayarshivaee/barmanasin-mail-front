import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  RouterLink,
} from '@angular/router';

import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  IonContent,
} from '@ionic/angular';

import {
  finalize,
} from 'rxjs';

import {
  MailAuthService,
  MailUser,
} from '../../core/auth/mail-auth.service';


@Component({
  selector: 'app-mail-settings',
  standalone: true,
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    IonContent,
    RouterLink,
  ],
})
export class SettingsPage implements OnInit, OnDestroy {
  private readonly authService =
    inject(MailAuthService);

  private readonly destroyRef =
    inject(DestroyRef);

  private previewObjectUrl: string | null = null;

  readonly user =
    signal<MailUser | null>(null);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isRemoving = signal(false);

  readonly selectedFile =
    signal<File | null>(null);

  readonly previewUrl = signal('');
  readonly imageFailed = signal(false);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly isBusy = computed(
    () => this.isSaving() || this.isRemoving(),
  );

  readonly displayedAvatar = computed(
    () =>
      this.previewUrl() ||
      this.user()?.avatar_url ||
      '',
  );


  ngOnInit(): void {
    this.loadAccount();
  }


  ngOnDestroy(): void {
    this.releasePreview();
  }


  loadAccount(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .me()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: ({ user }) => {
          this.user.set(user);
          this.imageFailed.set(false);
        },

        error: (error) => {
          this.handleError(
            error,
            'Unable to load your account. Please try again.',
          );
        },
      });
  }


  selectPhoto(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const file = input.files?.[0];

    // Allow selecting the same file again.
    input.value = '';

    if (!file || this.isBusy()) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage.set(
        'Please choose a JPG, PNG or WebP image.',
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage.set(
        'The photo must be 2 MB or smaller.',
      );
      return;
    }

    this.releasePreview();

    this.previewObjectUrl =
      URL.createObjectURL(file);

    this.selectedFile.set(file);
    this.previewUrl.set(this.previewObjectUrl);
    this.imageFailed.set(false);
  }


  discardPhoto(): void {
    if (this.isBusy()) {
      return;
    }

    this.clearSelection();
    this.errorMessage.set('');
    this.successMessage.set('');
  }


  savePhoto(): void {
    const file = this.selectedFile();

    if (
      !file ||
      !this.user() ||
      this.isBusy() ||
      this.imageFailed()
    ) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService
      .uploadAvatar(file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.user.update(
            user => user
              ? {
                ...user,
                avatar_url: response.avatar_url,
              }
              : user,
          );

          this.clearSelection();

          this.successMessage.set(
            'Your profile photo has been saved.',
          );
        },

        error: (error) => {
          this.handleError(
            error,
            'Unable to save your photo. Please try again.',
          );
        },
      });
  }


  removePhoto(): void {
    if (
      !this.user()?.avatar_url ||
      this.selectedFile() ||
      this.isBusy()
    ) {
      return;
    }

    this.isRemoving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService
      .removeAvatar()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isRemoving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.user.update(
            user => user
              ? {
                ...user,
                avatar_url: null,
              }
              : user,
          );

          this.clearSelection();

          this.successMessage.set(
            'Your profile photo has been removed.',
          );
        },

        error: (error) => {
          this.handleError(
            error,
            'Unable to remove your photo. Please try again.',
          );
        },
      });
  }


  onImageError(): void {
    this.imageFailed.set(true);

    if (this.selectedFile()) {
      this.errorMessage.set(
        'This image could not be opened. Please choose another photo.',
      );
    } else {
      this.errorMessage.set(
        'Your saved photo could not be loaded.',
      );
    }
  }


  initials(): string {
    const source =
      this.user()?.name?.trim() ||
      this.user()?.mailbox_address?.trim() ||
      'Mail Account';

    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return (
        parts[0][0] +
        parts[1][0]
      ).toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  }


  private clearSelection(): void {
    this.releasePreview();
    this.selectedFile.set(null);
    this.previewUrl.set('');
    this.imageFailed.set(false);
  }


  private releasePreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }


  private handleError(
    error: unknown,
    fallback: string,
  ): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        window.location.replace('/');
        return;
      }

      if (error.status === 413) {
        this.errorMessage.set(
          'The server rejected the file size. Please choose a smaller photo.',
        );
        return;
      }

      if (error.status === 422) {
        const validationMessage =
          error.error?.errors?.avatar?.[0];

        this.errorMessage.set(
          typeof validationMessage === 'string'
            ? validationMessage
            : fallback,
        );
        return;
      }
    }

    console.error('[Mail Settings]', error);
    this.errorMessage.set(fallback);
  }
}
