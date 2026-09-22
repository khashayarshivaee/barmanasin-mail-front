import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  MailTeamProfile,
  MailTeamProfileService,
  MailTeamProfileUpdate,
} from '../services/mail-team-profile.service';


interface TeamProfileForm {
  name_en: FormControl<string>;
  name_fa: FormControl<string>;

  job_title_en: FormControl<string>;
  job_title_fa: FormControl<string>;

  department_en: FormControl<string>;
  department_fa: FormControl<string>;

  bio_en: FormControl<string>;
  bio_fa: FormControl<string>;

  linkedin_url: FormControl<string>;

  public_email: FormControl<string>;
  public_phone: FormControl<string>;

  show_email: FormControl<boolean>;
  show_phone: FormControl<boolean>;

  is_public: FormControl<boolean>;
}


@Component({
  selector: 'app-mail-team-profile',
  standalone: true,
  templateUrl: './mail-team-profile.component.html',
  styleUrls: ['./mail-team-profile.component.scss'],
  imports: [
    ReactiveFormsModule,
  ],
  changeDetection:
  ChangeDetectionStrategy.OnPush,
})
export class MailTeamProfileComponent
  implements OnInit {

  private readonly teamProfileService =
    inject(MailTeamProfileService);

  private readonly destroyRef =
    inject(DestroyRef);


  readonly profile =
    signal<MailTeamProfile | null>(null);

  readonly isLoading =
    signal(true);

  readonly isSaving =
    signal(false);

  readonly isUploadingPhoto =
    signal(false);

  readonly isDeletingPhoto =
    signal(false);

  readonly message =
    signal('');

  readonly errorMessage =
    signal('');


  readonly form =
    new FormGroup<TeamProfileForm>({

      name_en:
        new FormControl('', {
          nonNullable: true,
        }),

      name_fa:
        new FormControl('', {
          nonNullable: true,
        }),

      job_title_en:
        new FormControl('', {
          nonNullable: true,
        }),

      job_title_fa:
        new FormControl('', {
          nonNullable: true,
        }),

      department_en:
        new FormControl('', {
          nonNullable: true,
        }),

      department_fa:
        new FormControl('', {
          nonNullable: true,
        }),

      bio_en:
        new FormControl('', {
          nonNullable: true,
        }),

      bio_fa:
        new FormControl('', {
          nonNullable: true,
        }),

      linkedin_url:
        new FormControl('', {
          nonNullable: true,
        }),

      public_email:
        new FormControl('', {
          nonNullable: true,
        }),

      public_phone:
        new FormControl('', {
          nonNullable: true,
        }),

      show_email:
        new FormControl(false, {
          nonNullable: true,
        }),

      show_phone:
        new FormControl(false, {
          nonNullable: true,
        }),

      is_public:
        new FormControl(false, {
          nonNullable: true,
        }),

    });


  ngOnInit(): void {
    this.loadProfile();
  }


  loadProfile(): void {

    this.isLoading.set(true);

    this.errorMessage.set('');

    this.teamProfileService
      .getProfile()
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({

        next: ({ profile }) => {

          this.applyProfile(
            profile,
          );

          this.isLoading.set(false);

        },

        error: (error) => {

          console.error(
            '[Team Profile] Unable to load profile.',
            error,
          );

          this.errorMessage.set(
            'Unable to load your team profile.',
          );

          this.isLoading.set(false);

        },

      });

  }


  save(): void {

    if (this.isSaving()) {
      return;
    }

    this.message.set('');
    this.errorMessage.set('');


    const raw =
      this.form.getRawValue();


    if (
      raw.is_public
      && (
        !raw.name_en.trim()
        || !raw.name_fa.trim()
        || !raw.job_title_en.trim()
        || !raw.job_title_fa.trim()
      )
    ) {

      this.errorMessage.set(
        'English and Persian name and job title are required before submitting your profile for approval.',
      );

      return;

    }


    if (
      raw.show_email
      && !raw.public_email.trim()
    ) {

      this.errorMessage.set(
        'Enter a public email address before enabling email visibility.',
      );

      return;

    }


    if (
      raw.show_phone
      && !raw.public_phone.trim()
    ) {

      this.errorMessage.set(
        'Enter a public phone number before enabling phone visibility.',
      );

      return;

    }


    const payload:
      MailTeamProfileUpdate = {

      name_en:
        this.nullable(
          raw.name_en,
        ),

      name_fa:
        this.nullable(
          raw.name_fa,
        ),

      job_title_en:
        this.nullable(
          raw.job_title_en,
        ),

      job_title_fa:
        this.nullable(
          raw.job_title_fa,
        ),

      department_en:
        this.nullable(
          raw.department_en,
        ),

      department_fa:
        this.nullable(
          raw.department_fa,
        ),

      bio_en:
        this.nullable(
          raw.bio_en,
        ),

      bio_fa:
        this.nullable(
          raw.bio_fa,
        ),

      linkedin_url:
        this.nullable(
          raw.linkedin_url,
        ),

      public_email:
        this.nullable(
          raw.public_email,
        ),

      public_phone:
        this.nullable(
          raw.public_phone,
        ),

      show_email:
      raw.show_email,

      show_phone:
      raw.show_phone,

      is_public:
      raw.is_public,

    };


    this.isSaving.set(true);


    this.teamProfileService
      .updateProfile(payload)
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({

        next: response => {

          this.applyProfile(
            response.profile,
          );

          this.message.set(
            response.message,
          );

          this.isSaving.set(false);

        },

        error: error => {

          console.error(
            '[Team Profile] Save failed.',
            error,
          );

          this.errorMessage.set(
            this.validationMessage(
              error,
            ),
          );

          this.isSaving.set(false);

        },

      });

  }


  onPhotoSelected(
    event: Event,
  ): void {

    if (
      this.isUploadingPhoto()
      || this.isDeletingPhoto()
    ) {
      return;
    }


    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    this.message.set('');
    this.errorMessage.set('');

    this.isUploadingPhoto.set(true);


    this.teamProfileService
      .uploadPhoto(file)
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({

        next: response => {

          this.applyProfile(
            response.profile,
          );

          this.message.set(
            response.message,
          );

          this.isUploadingPhoto.set(false);

          input.value = '';

        },

        error: error => {

          console.error(
            '[Team Profile] Photo upload failed.',
            error,
          );

          this.errorMessage.set(
            this.validationMessage(
              error,
            ),
          );

          this.isUploadingPhoto.set(false);

          input.value = '';

        },

      });

  }


  deletePhoto(): void {

    if (
      this.isDeletingPhoto()
      || this.isUploadingPhoto()
    ) {
      return;
    }


    if (
      !this.profile()
        ?.has_custom_photo
    ) {
      return;
    }


    this.message.set('');
    this.errorMessage.set('');

    this.isDeletingPhoto.set(true);


    this.teamProfileService
      .deletePhoto()
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({

        next: response => {

          this.applyProfile(
            response.profile,
          );

          this.message.set(
            response.message,
          );

          this.isDeletingPhoto.set(false);

        },

        error: error => {

          console.error(
            '[Team Profile] Photo delete failed.',
            error,
          );

          this.errorMessage.set(
            'Unable to remove your profile photo.',
          );

          this.isDeletingPhoto.set(false);

        },

      });

  }


  statusLabel(): string {

    switch (
      this.profile()?.approval_status
      ) {

      case 'pending':
        return 'Pending approval';

      case 'approved':
        return 'Approved';

      case 'rejected':
        return 'Changes requested';

      default:
        return 'Draft';

    }

  }


  private applyProfile(
    profile: MailTeamProfile,
  ): void {

    this.profile.set(
      profile,
    );


    this.form.patchValue({

      name_en:
        profile.name_en ?? '',

      name_fa:
        profile.name_fa ?? '',

      job_title_en:
        profile.job_title_en ?? '',

      job_title_fa:
        profile.job_title_fa ?? '',

      department_en:
        profile.department_en ?? '',

      department_fa:
        profile.department_fa ?? '',

      bio_en:
        profile.bio_en ?? '',

      bio_fa:
        profile.bio_fa ?? '',

      linkedin_url:
        profile.linkedin_url ?? '',

      public_email:
        profile.public_email ?? '',

      public_phone:
        profile.public_phone ?? '',

      show_email:
      profile.show_email,

      show_phone:
      profile.show_phone,

      is_public:
      profile.is_public,

    }, {
      emitEvent: false,
    });

  }


  private nullable(
    value: string,
  ): string | null {

    const normalized =
      value.trim();

    return normalized
      ? normalized
      : null;

  }


  private validationMessage(
    error: any,
  ): string {

    const errors =
      error?.error?.errors;


    if (
      errors
      && typeof errors === 'object'
    ) {

      const first =
        Object.values(errors)
          .flat()
          .find(
            value =>
              typeof value === 'string',
          );

      if (
        typeof first === 'string'
      ) {
        return first;
      }

    }


    return (
      error?.error?.message
      || 'Unable to save your team profile.'
    );

  }

}
