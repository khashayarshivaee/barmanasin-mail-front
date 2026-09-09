import {
  Component,
  signal,
  inject,
} from '@angular/core';

import { IonContent } from '@ionic/angular';

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
} from '../features/mail/compose/mail-compose.component';

import {
  MailSendService,
} from '../features/mail/services/mail-send.service';

import {
  MailFolderStateService,
} from '../features/mail/services/mail-folder-state.service';


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
  ],
})
export class HomePage {

  private readonly mailSendService =
    inject(MailSendService);

  private readonly folderState =
    inject(MailFolderStateService);


  readonly isComposeOpen =
    signal(false);

  readonly isSending =
    signal(false);

  readonly sendStatus =
    signal('');


  openCompose(): void {
    this.sendStatus.set('');
    this.isComposeOpen.set(true);
  }


  closeCompose(): void {
    this.isComposeOpen.set(false);
    this.sendStatus.set('');
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

}
