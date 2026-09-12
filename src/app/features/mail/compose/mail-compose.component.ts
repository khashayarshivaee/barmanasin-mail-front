import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

import {
  HttpEventType,
} from '@angular/common/http';



import {
  Observable,
  Subscription,
} from 'rxjs';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { IonIcon } from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  attachOutline,
  closeOutline,
} from 'ionicons/icons';

import {
  MailAttachmentService,
} from '../services/mail-attachment.service';

import {
  MailDraftService,
} from '../services/mail-draft.service';



interface MailAttachment {

  file: File;

  id: number | null;

  progress: number;

  status:
    | 'uploading'
    | 'ready'
    | 'failed';

}



export interface MailComposeDraft {

  to: string;

  cc: string;

  bcc: string;

  subject: string;

  body: string;

  attachments: number[];

  draftUid: string | null;

  existingAttachments: string[];

}
export interface MailComposeExistingAttachment {
  part: string;
  filename: string;
  content_type: string;
  size: number;
}


export interface MailComposeEditDraft {
  uid: string;

  to: string;
  cc: string;
  bcc: string;

  subject: string;
  body: string;

  attachments: MailComposeExistingAttachment[];
}



@Component({
  selector: 'app-mail-compose',
  standalone: true,
  templateUrl: './mail-compose.component.html',
  styleUrl: './mail-compose.component.scss',
  imports: [
    ReactiveFormsModule,
    IonIcon,
  ],
})
export class MailComposeComponent implements OnDestroy {


  private readonly attachmentService =
    inject(MailAttachmentService);

  private readonly draftService =
    inject(MailDraftService);

  readonly isSavingDraft =
    signal(false);

  readonly draftStatus =
    signal('');

  readonly isDeletingDraft =
    signal(false);

  private readonly uploadSubscriptions =
    new Map<File, Subscription>();



  private readonly progressTimers =
    new Map<File, ReturnType<typeof setInterval>>();





  readonly discard =
    output<void>();



  readonly sendRequested =
    output<MailComposeDraft>();

  readonly draftSaved =
    output<void>();



  readonly isSending =
    input(false);



  readonly sendStatus =
    input('');

  readonly editDraft =
    input<MailComposeEditDraft | null>(
      null,
    );



  readonly showCopyFields =
    signal(false);



  readonly attachments =
    signal<MailAttachment[]>([]);

  readonly existingAttachments =
    signal<MailComposeExistingAttachment[]>([]);



  readonly form =
    new FormGroup({

      to: new FormControl('', {
        nonNullable: true,
      }),

      cc: new FormControl('', {
        nonNullable: true,
      }),

      bcc: new FormControl('', {
        nonNullable: true,
      }),

      subject: new FormControl('', {
        nonNullable: true,
      }),

      body: new FormControl('', {
        nonNullable: true,
      }),

    });





  readonly hasContent =
    computed(() => {

      const value =
        this.form.getRawValue();



      return Boolean(

        value.to.trim()
        ||
        value.cc.trim()
        ||
        value.bcc.trim()
        ||
        value.subject.trim()
        ||
        value.body.trim()
        ||
        this.attachments().length

      );

    });





  constructor() {

    addIcons({

      attachOutline,

      closeOutline,

    });


    effect(() => {

      const draft =
        this.editDraft();


      if (!draft) {
        return;
      }


      this.form.patchValue({

        to:
        draft.to,

        cc:
        draft.cc,

        bcc:
        draft.bcc,

        subject:
        draft.subject,

        body:
        draft.body,

      });

      this.existingAttachments.set(
        draft.attachments ?? [],
      );


      this.showCopyFields.set(
        Boolean(
          draft.cc.trim()
          ||
          draft.bcc.trim()
        ),
      );

    });

  }





  ngOnDestroy(): void {


    this.uploadSubscriptions
      .forEach(
        subscription =>
          subscription.unsubscribe(),
      );


    this.uploadSubscriptions.clear();



    this.clearAllProgressTimers();

  }





  toggleCopyFields(): void {

    this.showCopyFields.update(
      current =>
        !current,
    );

  }





  onFilesSelected(
    event: Event,
  ): void {


    const input =
      event.target as HTMLInputElement;



    const files =
      Array.from(
        input.files ?? [],
      );



    input.value = '';



    if (!files.length) {

      return;

    }





    const items =
      files.map(
        file => ({

          file,

          id: null,

          progress: 0,

          status:
            'uploading' as const,

        }),
      );





    this.attachments.update(
      current => [

        ...current,

        ...items,

      ],
    );





    items.forEach(
      attachment =>
        this.uploadAttachment(
          attachment,
        ),
    );


  }





  private uploadAttachment(
    attachment: MailAttachment,
  ): void {


    /*
     * شروع نرم progress حتی برای فایل‌هایی که
     * خیلی سریع upload می‌شوند.
     *
     * تا قبل از دریافت Response بیشتر از 90
     * نمی‌رویم.
     */
    this.animateAttachmentProgress(
      attachment.file,
      15,
    );



    const subscription =
      this.attachmentService
        .upload(
          attachment.file,
        )
        .subscribe({


          next: event => {


            if (
              event.type === HttpEventType.UploadProgress
            ) {


              const realProgress =
                Math.round(
                  (
                    (event.loaded ?? 0)
                    /
                    (event.total ?? 1)
                  )
                  * 100,
                );



              /*
               * 100 واقعی upload را فعلاً به 90
               * محدود می‌کنیم چون هنوز response
               * نهایی server دریافت نشده.
               */
              const visualTarget =
                Math.min(
                  90,
                  Math.max(
                    15,
                    realProgress,
                  ),
                );



              this.animateAttachmentProgress(
                attachment.file,
                visualTarget,
              );


            }





            if (
              event.type ===
              HttpEventType.Response
            ) {


              const id =
                event.body
                  ?.attachment
                  ?.id
                ??
                event.body
                  ?.id;



              if (!id) {


                this.clearProgressTimer(
                  attachment.file,
                );


                this.updateAttachment(
                  attachment.file,
                  {

                    id: null,

                    progress: 0,

                    status: 'failed',

                  },
                );


                return;

              }





              /*
               * response رسیده، ولی مستقیم 100 نمی‌کنیم.
               * نرم تا 100 می‌رویم و بعد ready می‌شود.
               */
              this.animateAttachmentProgress(
                attachment.file,
                100,
                () => {


                  this.updateAttachment(
                    attachment.file,
                    {

                      id,

                      progress: 100,

                      status: 'ready',

                    },
                  );


                },
              );


            }


          },





          error: () => {


            this.clearProgressTimer(
              attachment.file,
            );


            this.updateAttachment(
              attachment.file,
              {

                progress: 0,

                status: 'failed',

              },
            );


          },



          complete: () => {

            this.uploadSubscriptions.delete(
              attachment.file,
            );

          },



        });




    this.uploadSubscriptions.set(
      attachment.file,
      subscription,
    );

  }





  private animateAttachmentProgress(
    file: File,
    target: number,
    onComplete?: () => void,
  ): void {


    const attachment =
      this.attachments()
        .find(
          item =>
            item.file === file,
        );



    if (!attachment) {

      return;

    }



    const current =
      attachment.progress;



    const safeTarget =
      Math.max(
        0,
        Math.min(
          100,
          target,
        ),
      );



    if (safeTarget <= current) {


      if (
        safeTarget === 100
        &&
        onComplete
      ) {

        onComplete();

      }


      return;

    }





    /*
     * Timer قبلی همان فایل را حذف می‌کنیم
     * تا چند interval همزمان نداشته باشیم.
     */
    this.clearProgressTimer(
      file,
    );



    let value =
      current;



    const timer =
      setInterval(
        () => {


          /*
           * هرچه فاصله بیشتر باشد کمی سریع‌تر حرکت کند،
           * نزدیک target نرم‌تر شود.
           */
          const remaining =
            safeTarget - value;



          let step = 1;


          if (remaining > 50) {

            step = 4;

          }
          else if (remaining > 25) {

            step = 3;

          }
          else if (remaining > 10) {

            step = 2;

          }



          value =
            Math.min(
              safeTarget,
              value + step,
            );



          this.updateAttachment(
            file,
            {
              progress: value,
            },
          );



          if (
            value >= safeTarget
          ) {


            this.clearProgressTimer(
              file,
            );


            onComplete?.();


          }


        },
        35,
      );



    this.progressTimers.set(
      file,
      timer,
    );

  }





  private clearProgressTimer(
    file: File,
  ): void {


    const timer =
      this.progressTimers.get(
        file,
      );



    if (timer === undefined) {

      return;

    }



    clearInterval(
      timer,
    );



    this.progressTimers.delete(
      file,
    );

  }





  private clearAllProgressTimers(): void {


    this.progressTimers
      .forEach(
        timer =>
          clearInterval(
            timer,
          ),
      );



    this.progressTimers.clear();

  }





  private updateAttachment(
    file: File,
    changes: Partial<MailAttachment>,
  ): void {


    this.attachments.update(
      items =>

        items.map(
          item =>

            item.file === file

              ? {

                ...item,

                ...changes,

              }

              :

              item,

        ),

    );

  }





  removeAttachment(
    index: number,
  ): void {


    const attachment =
      this.attachments()[index];



    if (!attachment) {

      return;

    }



    this.uploadSubscriptions
      .get(
        attachment.file,
      )
      ?.unsubscribe();



    this.uploadSubscriptions.delete(
      attachment.file,
    );



    this.clearProgressTimer(
      attachment.file,
    );



    this.attachments.update(
      files =>

        files.filter(
          (_, i) =>
            i !== index,
        ),

    );


  }





  formatFileSize(
    bytes: number,
  ): string {


    if (bytes < 1024) {

      return `${bytes} B`;

    }



    const kb =
      bytes / 1024;



    if (kb < 1024) {

      return `${kb.toFixed(1)} KB`;

    }



    const mb =
      kb / 1024;



    return `${mb.toFixed(1)} MB`;

  }

  removeExistingAttachment(
    part: string,
  ): void {

    if (
      this.isSending()
      ||
      this.isSavingDraft()
    ) {
      return;
    }


    this.existingAttachments.update(
      attachments =>
        attachments.filter(
          attachment =>
            attachment.part !== part,
        ),
    );

  }


  onSaveDraft(): void {

    if (
      this.isSending()
      || this.isSavingDraft()
      || this.isDeletingDraft()
    ) {
      return;
    }


    const uploading =
      this.attachments()
        .some(
          item =>
            item.status === 'uploading',
        );


    if (uploading) {
      this.draftStatus.set(
        'Wait for attachments to finish uploading.',
      );

      return;
    }


    const value =
      this.form.getRawValue();


    const attachmentIds =
      this.attachments()
        .filter(
          item =>
            item.status === 'ready'
            &&
            item.id !== null,
        )
        .map(
          item =>
            item.id as number,
        );


    const hasContent =
      Boolean(
        value.to.trim()
        ||
        value.cc.trim()
        ||
        value.bcc.trim()
        ||
        value.subject.trim()
        ||
        value.body.trim()
        ||
        attachmentIds.length
      );


    if (!hasContent) {
      this.draftStatus.set(
        'Nothing to save.',
      );

      return;
    }


    this.isSavingDraft.set(
      true,
    );

    this.draftStatus.set(
      'Saving draft...',
    );


    const currentDraft =
      this.editDraft();


    const payload = {

      to:
        value.to.trim(),

      cc:
        value.cc.trim(),

      bcc:
        value.bcc.trim(),

      subject:
        value.subject.trim(),

      body:
      value.body,

      attachments:
      attachmentIds,

      existing_attachments:
        this.existingAttachments()
          .map(
            attachment =>
              attachment.part,
          ),

    };


    const request: Observable<unknown> =
      currentDraft

        ? this.draftService.updateDraft(
          currentDraft.uid,
          payload,
        )

        : this.draftService.saveDraft(
          payload,
        );


    request.subscribe({

        next: () => {

          this.isSavingDraft.set(
            false,
          );

          this.draftStatus.set(
            currentDraft
              ? 'Draft updated.'
              : 'Draft saved.',
          );

          this.uploadSubscriptions
            .forEach(
              subscription =>
                subscription.unsubscribe(),
            );

          this.uploadSubscriptions.clear();

          this.clearAllProgressTimers();

          this.form.reset();

          this.attachments.set([]);
          this.existingAttachments.set([]);
          this.showCopyFields.set(
            false,
          );


          this.draftSaved.emit();

        },


        error: (error) => {

          console.error(
            '[Mail] Unable to save draft.',
            error,
          );

          this.isSavingDraft.set(
            false,
          );

          this.draftStatus.set(
            'Unable to save draft.',
          );

        },

      });

  }





  onDiscard(): void {

    if (
      this.isSending()
      ||
      this.isSavingDraft()
      ||
      this.isDeletingDraft()
    ) {
      return;
    }


    const currentDraft =
      this.editDraft();


    /*
     * New compose:
     * nothing has been stored in Drafts yet.
     */
    if (!currentDraft) {

      this.uploadSubscriptions
        .forEach(
          subscription =>
            subscription.unsubscribe(),
        );

      this.uploadSubscriptions.clear();

      this.clearAllProgressTimers();

      this.form.reset();

      this.attachments.set([]);

      this.existingAttachments.set([]);

      this.showCopyFields.set(
        false,
      );

      this.draftStatus.set('');

      this.discard.emit();

      return;
    }


    /*
     * Existing Draft:
     * delete it from Dovecot first.
     */
    this.isDeletingDraft.set(
      true,
    );

    this.draftStatus.set(
      'Deleting draft...',
    );


    this.draftService
      .deleteDraft(
        currentDraft.uid,
      )
      .subscribe({

        next: () => {

          this.isDeletingDraft.set(
            false,
          );

          this.uploadSubscriptions
            .forEach(
              subscription =>
                subscription.unsubscribe(),
            );

          this.uploadSubscriptions.clear();

          this.clearAllProgressTimers();

          this.form.reset();

          this.attachments.set([]);

          this.existingAttachments.set([]);

          this.showCopyFields.set(
            false,
          );

          this.draftStatus.set('');

          this.discard.emit();
        },


        error: (error) => {

          console.error(
            '[Mail] Unable to delete draft.',
            error,
          );

          this.isDeletingDraft.set(
            false,
          );

          this.draftStatus.set(
            'Unable to delete draft.',
          );
        },

      });
  }





  onSend(): void {

    if (
      this.isSending()
      ||
      this.isSavingDraft()
      ||
      this.isDeletingDraft()
    ) {
      return;
    }


    const draft =
      this.form.getRawValue();



    if (
      !draft.to.trim()
    ) {


      this.form.controls.to.markAsTouched();


      return;

    }





    const uploading =
      this.attachments()
        .some(
          item =>
            item.status === 'uploading',
        );



    if (uploading) {

      return;

    }





    const attachmentIds =
      this.attachments()
        .filter(
          item =>
            item.status === 'ready'
            &&
            item.id !== null,
        )
        .map(
          item =>
            item.id as number,
        );




    this.draftStatus.set('');
    this.sendRequested.emit({

      to:
        draft.to.trim(),


      cc:
        draft.cc.trim(),


      bcc:
        draft.bcc.trim(),


      subject:
        draft.subject.trim(),


      body:
      draft.body,


      attachments:
      attachmentIds,

      draftUid:
        this.editDraft()?.uid ?? null,

      existingAttachments:
        this.existingAttachments()
          .map(
            attachment =>
              attachment.part,
          ),

    });


  }


}
