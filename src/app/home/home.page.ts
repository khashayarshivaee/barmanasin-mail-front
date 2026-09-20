import {
  Component,
  signal,
  inject,
  DestroyRef,
  OnInit,
  AfterViewInit,

} from '@angular/core';

import {
  MailWelcomeComponent,
} from '../features/mail/welcome/mail-welcome.component';

import {
  ViewChild,
} from '@angular/core';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  MailAuthService,
  MailUser,
} from '../core/auth/mail-auth.service';

import {
  IonContent,
  ModalController,
} from '@ionic/angular';



import {
  MailSearchModalComponent,
} from '../features/mail/search/mail-search-modal.component';

import {
  MailShellComponent,
} from '../layout/mail-shell/mail-shell.component';

import {
  MailSidebarComponent,
} from '../features/mail/sidebar/mail-sidebar.component';

import {
  MailTopbarComponent,
} from '../features/mail/topbar/mail-topbar.component';

import {
  MailInboxComponent,
} from '../features/mail/inbox/mail-inbox.component';

import {
  MailComposeComponent,
  MailComposeDraft,
  MailComposeEditDraft,
} from '../features/mail/compose/mail-compose.component';

import {
  MailMessageDetail,
} from '../features/mail/services/mail-message.service';

import {
  MailSendService,
} from '../features/mail/services/mail-send.service';

import {
  MailFolderStateService,
} from '../features/mail/services/mail-folder-state.service';

import {
  MailRealtimeService,
} from '../features/mail/services/mail-realtime.service';


@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonContent,
    MailShellComponent,
    MailSidebarComponent,
    MailTopbarComponent,
    MailInboxComponent,
    MailComposeComponent,
    MailWelcomeComponent,
  ],
})


export class HomePage implements OnInit, AfterViewInit {


  private readonly mailSendService =
    inject(MailSendService);

  private readonly folderState =
    inject(MailFolderStateService);

  private readonly modalController =
    inject(ModalController);


  readonly isComposeOpen =
    signal(false);

  readonly isSending =
    signal(false);

  readonly sendStatus =
    signal('');

  readonly editDraft =
    signal<MailComposeEditDraft | null>(
      null,
    );

  readonly searchQuery =
    signal('');

  readonly replyDraft =
    signal<MailComposeDraft | null>(
      null,
    );

  private readonly mailAuthService =
    inject(MailAuthService);

  private readonly mailRealtime =
    inject(MailRealtimeService);

  private readonly destroyRef =
    inject(DestroyRef);

  readonly currentUser =
    signal<MailUser | null>(null);

  @ViewChild(
    MailInboxComponent,
  )

  private mailShell?: MailShellComponent;

  private mailInbox?: MailInboxComponent;
  private inboxReady = false;

  ngOnInit(): void {
    this.mailAuthService
      .me()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ user }) => {

          this.currentUser.set(user);

          this.mailRealtime.connect(
            user.id,
          );


          if (user.show_welcome) {

            void this.openWelcome();

          }

        },

        error: (error) => {
          console.error(
            '[Mail] Unable to load account.',
            error,
          );

          if (error.status === 401) {
            window.location.replace('/');
          }
        },
      });
  }

  ngAfterViewInit(): void {

    this.inboxReady = true;


    this.mailRealtime.messageReceived
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe(() => {

        if (!this.inboxReady) {
          return;
        }


        this.mailInbox
          ?.loadCurrentFolder();

      });

  }

  openCompose(): void {

    this.editDraft.set(null);

    this.replyDraft.set(null);

    this.sendStatus.set('');

    this.isComposeOpen.set(true);

  }

  closeCompose(): void {

    this.isComposeOpen.set(false);

    this.editDraft.set(null);

    this.replyDraft.set(null);

    this.sendStatus.set('');

  }

  openDraft(
    message: MailMessageDetail,
  ): void {

    this.sendStatus.set('');


    this.editDraft.set({
      uid:
      message.uid,

      to:
      message.to,

      cc:
      message.cc,

      bcc:
      message.bcc,

      subject:
        message.subject === '(No subject)'
          ? ''
          : message.subject,

      body:
      message.body.text,

      attachments:
        message.attachments.map(
          attachment => ({
            part:
            attachment.part,

            filename:
            attachment.filename,

            content_type:
            attachment.content_type,

            size:
            attachment.size,
          }),
        ),
    });


    this.isComposeOpen.set(
      true,
    );
  }


  onFolderChange(): void {
    this.closeCompose();
  }


  sendMail(
    draft: MailComposeDraft,
  ): void {

    if (this.isSending()) {
      return;
    }


    const formData =
      new FormData();


    formData.append(
      'to',
      draft.to,
    );


    formData.append(
      'cc',
      draft.cc,
    );


    formData.append(
      'bcc',
      draft.bcc,
    );


    formData.append(
      'subject',
      draft.subject,
    );


    formData.append(
      'body',
      draft.body,
    );


    draft.attachments.forEach(
      attachmentId => {

        formData.append(
          'attachments[]',
          String(attachmentId),
        );

      },
    );

    if (draft.draftUid) {

      formData.append(
        'draft_uid',
        draft.draftUid,
      );


      formData.append(
        'existing_attachments_provided',
        '1',
      );


      draft.existingAttachments
        .forEach(
          part => {

            formData.append(
              'existing_attachments[]',
              part,
            );

          },
        );

    }


    this.isSending.set(true);
    this.sendStatus.set(
      'Sending message...',
    );


    this.mailSendService
      .send(formData)
      .subscribe({

        next: () => {

          this.isSending.set(false);

          this.sendStatus.set(
            '✓ Message sent successfully',
          );


          this.folderState.setFolder(
            'sent',
          );


          setTimeout(() => {

            this.closeCompose();

          }, 1200);

        },


        error: (error) => {

          console.error(
            '[Mail] Send failed',
            error,
          );


          this.isSending.set(false);

          this.sendStatus.set(
            'Unable to send message',
          );

        },

      });
  }

  onDraftSaved(): void {

    this.folderState.setFolder(
      'drafts',
    );

    this.closeCompose();

  }

  openReply(
    draft: MailComposeDraft,
  ): void {

    this.editDraft.set(null);

    this.replyDraft.set(
      draft,
    );

    this.sendStatus.set('');

    this.isComposeOpen.set(true);

  }

  onSearch(
    value: string,
  ): void {
    this.searchQuery.set(
      value,
    );
  }


  async openSearch(): Promise<void> {

    const modal =
      await this.modalController.create({
        component:
        MailSearchModalComponent,

        cssClass:
          'mail-search-modal',
      });


    await modal.present();


    const result =
      await modal.onDidDismiss();


    if (!result.data) {
      return;
    }


    this.mailInbox
      ?.openExternalMessage(
        result.data,
      );

  }

  private async openWelcome(): Promise<void> {

    const modal =
      await this.modalController.create({
        component:
        MailWelcomeComponent,

        cssClass:
          'mail-welcome-modal',

        backdropDismiss:
          false,
      });


    await modal.present();

  }


}
