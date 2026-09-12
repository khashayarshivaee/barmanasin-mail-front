import {
  Component,
  effect,
  inject,
  OnDestroy,
  output,
  input,
  signal,
} from '@angular/core';



import {
  IonCard,
  IonIcon,
  IonSkeletonText,
} from '@ionic/angular';

import {
  addIcons,
} from 'ionicons';

import {
  archiveOutline,
  documentOutline,
  documentTextOutline,
  downloadOutline,
  imageOutline,
  trashOutline,
} from 'ionicons/icons';

import {
  MailAttachment,
  MailMessageDetail,
  MailMessageService,
} from '../services/mail-message.service';


type AttachmentPreviewState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'failed';


@Component({
  selector: 'app-mail-message-view',
  standalone: true,
  templateUrl: './mail-message-view.component.html',
  styleUrl: './mail-message-view.component.scss',
  imports: [
    IonCard,
    IonIcon,
    IonSkeletonText,
  ],
})
export class MailMessageViewComponent
  implements OnDestroy {

  private readonly mailMessageService =
    inject(MailMessageService);


  private readonly attachmentUrls =
    signal<Record<string, string>>({});


  private readonly attachmentStates =
    signal<Record<string, AttachmentPreviewState>>({});


  private activeMessageKey = '';


  readonly message =
    input.required<MailMessageDetail>();


  readonly back =
    output<void>();


  readonly archive =
    output<MailMessageDetail>();


  readonly trash =
    output<MailMessageDetail>();


  constructor() {
    addIcons({
      archiveOutline,
      documentOutline,
      documentTextOutline,
      downloadOutline,
      imageOutline,
      trashOutline,
    });


    effect(() => {
      const message =
        this.message();

      const messageKey =
        `${message.mailbox}:${message.uid}`;


      if (
        this.activeMessageKey !== messageKey
      ) {
        this.releasePreviewUrls();

        this.activeMessageKey =
          messageKey;
      }


      for (
        const attachment
        of message.attachments
        ) {
        if (
          this.isImageAttachment(
            attachment,
          )
        ) {
          this.ensureImagePreview(
            attachment,
          );
        }
      }
    });
  }


  ngOnDestroy(): void {
    this.releasePreviewUrls();
  }


  onBack(): void {
    this.back.emit();
  }


  onArchive(): void {
    this.archive.emit(
      this.message(),
    );
  }


  onTrash(): void {
    this.trash.emit(
      this.message(),
    );
  }


  canArchive(): boolean {
    return (
      this.message().mailbox !== 'Archive' &&
      this.message().mailbox !== 'Trash'
    );
  }


  canTrash(): boolean {
    return (
      this.message().mailbox !== 'Trash'
    );
  }


  senderInitials(): string {
    const message =
      this.message();

    const source =
      message.from.name ||
      message.from.address ||
      '?';

    const parts =
      source
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (parts.length === 0) {
      return '?';
    }


    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }


    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }


  readableBody(): string {
    const message =
      this.message();


    if (
      message.body.text.trim()
    ) {
      return message.body.text;
    }


    return 'This message does not contain a plain-text body.';
  }


  isImageAttachment(
    attachment: MailAttachment,
  ): boolean {
    return attachment.content_type
      .toLowerCase()
      .startsWith('image/');
  }


  isPdfAttachment(
    attachment: MailAttachment,
  ): boolean {
    return (
      attachment.content_type
        .toLowerCase() ===
      'application/pdf'
    );
  }


  attachmentIcon(
    attachment: MailAttachment,
  ): string {
    if (
      this.isImageAttachment(
        attachment,
      )
    ) {
      return 'image-outline';
    }


    if (
      this.isPdfAttachment(
        attachment,
      )
    ) {
      return 'document-text-outline';
    }


    return 'document-outline';
  }


  attachmentTypeLabel(
    attachment: MailAttachment,
  ): string {
    if (
      this.isImageAttachment(
        attachment,
      )
    ) {
      return 'Image';
    }


    if (
      this.isPdfAttachment(
        attachment,
      )
    ) {
      return 'PDF';
    }


    const contentType =
      attachment.content_type
        .trim()
        .toLowerCase();


    if (
      contentType.includes(
        'spreadsheet',
      ) ||
      contentType.includes(
        'excel',
      )
    ) {
      return 'Spreadsheet';
    }


    if (
      contentType.includes(
        'word',
      ) ||
      contentType.includes(
        'document',
      )
    ) {
      return 'Document';
    }


    if (
      contentType.includes(
        'zip',
      ) ||
      contentType.includes(
        'compressed',
      )
    ) {
      return 'Archive';
    }


    return 'File';
  }


  formattedAttachmentSize(
    size: number,
  ): string {
    if (
      !Number.isFinite(size) ||
      size <= 0
    ) {
      return '';
    }


    if (size < 1024) {
      return `${size} B`;
    }


    const kilobytes =
      size / 1024;


    if (kilobytes < 1024) {
      return `${kilobytes.toFixed(1)} KB`;
    }


    const megabytes =
      kilobytes / 1024;


    if (megabytes < 1024) {
      return `${megabytes.toFixed(1)} MB`;
    }


    const gigabytes =
      megabytes / 1024;


    return `${gigabytes.toFixed(1)} GB`;
  }


  attachmentPreviewUrl(
    attachment: MailAttachment,
  ): string {
    return (
      this.attachmentUrls()[
        this.attachmentKey(
          attachment,
        )
        ] ?? ''
    );
  }


  attachmentPreviewState(
    attachment: MailAttachment,
  ): AttachmentPreviewState {
    return (
      this.attachmentStates()[
        this.attachmentKey(
          attachment,
        )
        ] ?? 'idle'
    );
  }


  attachmentPreviewLoading(
    attachment: MailAttachment,
  ): boolean {
    const state =
      this.attachmentPreviewState(
        attachment,
      );


    return (
      state === 'idle' ||
      state === 'loading'
    );
  }


  attachmentPreviewFailed(
    attachment: MailAttachment,
  ): boolean {
    return (
      this.attachmentPreviewState(
        attachment,
      ) === 'failed'
    );
  }


  downloadAttachment(
    attachment: MailAttachment,
  ): void {
    const message =
      this.message();


    this.mailMessageService
      .downloadAttachment(
        message.uid,
        attachment.part,
        message.mailbox,
      )
      .subscribe({
        next: (blob) => {
          const url =
            URL.createObjectURL(
              blob,
            );

          const link =
            document.createElement(
              'a',
            );

          link.href =
            url;

          link.download =
            attachment.filename ||
            'attachment';

          document.body.appendChild(
            link,
          );

          link.click();

          link.remove();

          window.setTimeout(
            () => {
              URL.revokeObjectURL(
                url,
              );
            },
            1000,
          );
        },

        error: (error) => {
          console.error(
            '[Mail] Unable to download attachment.',
            error,
          );
        },
      });
  }


  private ensureImagePreview(
    attachment: MailAttachment,
  ): void {
    const key =
      this.attachmentKey(
        attachment,
      );

    const state =
      this.attachmentStates()[
        key
        ];


    if (
      state === 'loading' ||
      state === 'ready' ||
      state === 'failed'
    ) {
      return;
    }


    this.setAttachmentState(
      key,
      'loading',
    );


    const message =
      this.message();


    this.mailMessageService
      .downloadAttachment(
        message.uid,
        attachment.part,
        message.mailbox,
      )
      .subscribe({
        next: (blob) => {
          const url =
            URL.createObjectURL(
              blob,
            );


          this.attachmentUrls.update(
            (current) => ({
              ...current,
              [key]: url,
            }),
          );


          this.setAttachmentState(
            key,
            'ready',
          );
        },


        error: (error) => {
          console.error(
            '[Mail] Unable to load attachment preview.',
            error,
          );


          this.setAttachmentState(
            key,
            'failed',
          );
        },
      });
  }


  private attachmentKey(
    attachment: MailAttachment,
  ): string {
    const message =
      this.message();


    return [
      message.mailbox,
      message.uid,
      attachment.part,
    ].join(':');
  }


  private setAttachmentState(
    key: string,
    state: AttachmentPreviewState,
  ): void {
    this.attachmentStates.update(
      (current) => ({
        ...current,
        [key]: state,
      }),
    );
  }


  private releasePreviewUrls(): void {
    const urls =
      Object.values(
        this.attachmentUrls(),
      );


    for (const url of urls) {
      URL.revokeObjectURL(
        url,
      );
    }


    this.attachmentUrls.set({});

    this.attachmentStates.set({});
  }
}
