import {
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  output
} from '@angular/core';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  Subscription,
} from 'rxjs';

import {
  MailMessageListComponent,
  MailMessageSummary,
} from '../message-list/mail-message-list.component';

import {
  MailInboxMessage,
  MailInboxService,
} from '../services/mail-inbox.service';

import {
  MailMessageDetail,
  MailMessageService,
} from '../services/mail-message.service';

import {
  MailFolder,
  MailFolderStateService,
} from '../services/mail-folder-state.service';

import {
  MailMessageViewComponent,
} from '../message-view/mail-message-view.component';

@Component({
  selector: 'app-mail-inbox',
  standalone: true,
  templateUrl: './mail-inbox.component.html',
  styleUrl: './mail-inbox.component.scss',
  imports: [
    MailMessageListComponent,
    MailMessageViewComponent,
  ],
})
export class MailInboxComponent {
  private readonly inboxService =
    inject(MailInboxService);

  private readonly messageService =
    inject(MailMessageService);

  private readonly folderState =
    inject(MailFolderStateService);

  private readonly destroyRef =
    inject(DestroyRef);



  private folderRequest?: Subscription;
  private messageRequest?: Subscription;
  private seenRequest?: Subscription;
  private archiveRequest?: Subscription;
  private trashRequest?: Subscription;

  private readonly starRequests =
    new Map<string, Subscription>();

  readonly activeFolder =
    this.folderState.activeFolder;

  readonly messages =
    signal<MailMessageSummary[]>([]);

  readonly selectedMessageId =
    signal<string | null>(null);

  readonly selectedMessage =
    signal<MailMessageDetail | null>(null);

  readonly isMessageLoading =
    signal(false);

  readonly messageError =
    signal('');

  readonly draftEditRequested =
    output<MailMessageDetail>();

  constructor() {
    effect(() => {
      const folder =
        this.activeFolder();

      this.closeMessage();
      this.loadFolder(folder);
    });
  }

  loadCurrentFolder(): void {
    this.loadFolder(
      this.activeFolder(),
    );
  }

  openMessage(
    message: MailMessageSummary,
  ): void {
    this.messageRequest?.unsubscribe();
    this.seenRequest?.unsubscribe();

    this.selectedMessageId.set(
      message.id,
    );

    this.selectedMessage.set(null);

    this.messageError.set('');
    this.isMessageLoading.set(true);

    this.messageRequest =
      this.messageService
        .getMessage(
          message.uid,
          message.mailbox,
        )
        .pipe(
          takeUntilDestroyed(
            this.destroyRef,
          ),
        )
        .subscribe({
          next: (response) => {

            if (
              response.message.mailbox === 'Drafts'
            ) {
              this.selectedMessageId.set(null);

              this.selectedMessage.set(null);

              this.isMessageLoading.set(false);

              this.draftEditRequested.emit(
                response.message,
              );

              return;
            }
            this.selectedMessage.set(
              response.message,
            );

            this.isMessageLoading.set(
              false,
            );

            if (
              response.message.unread
            ) {
              this.markMessageSeen(
                response.message.uid,
                response.message.mailbox,
              );
            }
          },

          error: (error) => {
            console.error(
              '[Mail] Unable to load message.',
              error,
            );

            this.messageError.set(
              'Unable to load this message.',
            );

            this.isMessageLoading.set(
              false,
            );
          },
        });
  }

  toggleMessageStar(
    message: MailMessageSummary,
  ): void {
    const key = message.id;
    const starred =
      !message.starred;

    this.starRequests
      .get(key)
      ?.unsubscribe();

    this.updateSummaryStarred(
      message.mailbox,
      message.uid,
      starred,
    );

    this.updateSelectedMessageStarred(
      message.mailbox,
      message.uid,
      starred,
    );

    const request =
      this.messageService
        .setStarred(
          message.uid,
          starred,
          message.mailbox,
        )
        .pipe(
          takeUntilDestroyed(
            this.destroyRef,
          ),
        )
        .subscribe({
          next: (response) => {
            if (
              this.activeFolder() ===
              'starred' &&
              !response.starred
            ) {
              this.removeSummary(
                response.message.mailbox,
                response.message.uid,
              );
            } else {
              this.updateSummaryStarred(
                response.message.mailbox,
                response.message.uid,
                response.starred,
              );
            }

            this.updateSelectedMessageStarred(
              response.message.mailbox,
              response.message.uid,
              response.starred,
            );

            this.starRequests.delete(
              key,
            );
          },

          error: (error) => {
            console.error(
              '[Mail] Unable to update star state.',
              error,
            );

            this.starRequests.delete(
              key,
            );

            this.loadCurrentFolder();
          },
        });

    this.starRequests.set(
      key,
      request,
    );
  }

  closeMessage(): void {
    this.messageRequest?.unsubscribe();
    this.seenRequest?.unsubscribe();
    this.archiveRequest?.unsubscribe();
    this.trashRequest?.unsubscribe();

    this.messageRequest = undefined;
    this.seenRequest = undefined;
    this.archiveRequest = undefined;
    this.trashRequest = undefined;

    this.selectedMessageId.set(null);
    this.selectedMessage.set(null);

    this.messageError.set('');
    this.isMessageLoading.set(false);
  }

  retryMessage(): void {
    const selectedId =
      this.selectedMessageId();

    if (!selectedId) {
      return;
    }

    const summary =
      this.messages().find(
        (message) =>
          message.id === selectedId,
      );

    if (!summary) {
      return;
    }

    this.openMessage(summary);
  }

  folderTitle(): string {
    switch (
      this.activeFolder()
      ) {
      case 'starred':
        return 'Starred';

      case 'sent':
        return 'Sent';

      case 'drafts':
        return 'Drafts';

        case 'archive':
        return 'Archive';

      case 'trash':
        return 'Trash';

      case 'inbox':
      default:
        return 'Inbox';
    }
  }

  folderEyebrow(): string {
    switch (
      this.activeFolder()
      ) {
      case 'starred':
        return 'FLAGGED MAIL';

      case 'drafts':
        return 'DRAFT MAIL';

      case 'archive':
        return 'ARCHIVED MAIL';

      case 'trash':
        return 'TRASH';

      default:
        return 'MAILBOX';
    }
  }

  folderToolbarLabel(): string {
    switch (
      this.activeFolder()
      ) {
      case 'starred':
        return 'Starred messages';

      case 'drafts':
        return 'Saved drafts';

      case 'archive':
        return 'Archived messages';

      case 'trash':
        return 'Trash messages';

      default:
        return 'Recent messages';
    }
  }

  private loadFolder(
    folder: MailFolder,
  ): void {
    this.folderRequest?.unsubscribe();

    if (
      folder !== 'inbox' &&
      folder !== 'starred' &&
      folder !== 'sent' &&
      folder !== 'drafts' &&
      folder !== 'archive' &&
      folder !== 'trash'
    ) {
      this.messages.set([]);
      return;
    }

    const source =
      folder === 'starred'
        ? this.inboxService.getStarred()
        : folder === 'sent'
          ? this.inboxService.getSent()
          : folder === 'drafts'
            ? this.inboxService.getDrafts()
            : folder === 'archive'
              ? this.inboxService.getArchive()
              : folder === 'trash'
                ? this.inboxService.getTrash()
                : this.inboxService.getInbox();

    this.folderRequest =
      source
        .pipe(
          takeUntilDestroyed(
            this.destroyRef,
          ),
        )
        .subscribe({
          next: (response) => {
            this.messages.set(
              response.messages.map(
                (message) =>
                  this.mapMessage(
                    message,
                  ),
              ),
            );
          },

          error: (error) => {
            console.error(
              `[Mail] Unable to load ${folder}.`,
              error,
            );

            this.messages.set([]);
          },
        });
  }

  private markMessageSeen(
    uid: string,
    mailbox: string,
  ): void {
    this.markSummarySeen(
      mailbox,
      uid,
    );

    this.seenRequest =
      this.messageService
        .setSeen(
          uid,
          true,
          mailbox,
        )
        .pipe(
          takeUntilDestroyed(
            this.destroyRef,
          ),
        )
        .subscribe({
          next: (response) => {
            this.selectedMessage.update(
              (current) => {
                if (
                  !current ||
                  current.uid !== uid ||
                  current.mailbox !==
                  mailbox
                ) {
                  return current;
                }

                return response.message;
              },
            );

            this.markSummarySeen(
              mailbox,
              uid,
            );
          },

          error: (error) => {
            console.error(
              '[Mail] Unable to mark message as seen.',
              error,
            );

            this.loadCurrentFolder();
          },
        });
  }

  private markSummarySeen(
    mailbox: string,
    uid: string,
  ): void {
    const id =
      this.messageKey(
        mailbox,
        uid,
      );

    this.messages.update(
      (messages) =>
        messages.map(
          (message) =>
            message.id === id
              ? {
                ...message,
                unread: false,
              }
              : message,
        ),
    );
  }

  private updateSummaryStarred(
    mailbox: string,
    uid: string,
    starred: boolean,
  ): void {
    const id =
      this.messageKey(
        mailbox,
        uid,
      );

    this.messages.update(
      (messages) =>
        messages.map(
          (message) =>
            message.id === id
              ? {
                ...message,
                starred,
              }
              : message,
        ),
    );
  }

  private removeSummary(
    mailbox: string,
    uid: string,
  ): void {
    const id =
      this.messageKey(
        mailbox,
        uid,
      );

    this.messages.update(
      (messages) =>
        messages.filter(
          (message) =>
            message.id !== id,
        ),
    );
  }

  private updateSelectedMessageStarred(
    mailbox: string,
    uid: string,
    starred: boolean,
  ): void {
    this.selectedMessage.update(
      (message) => {
        if (
          !message ||
          message.uid !== uid ||
          message.mailbox !== mailbox
        ) {
          return message;
        }

        return {
          ...message,
          starred,
        };
      },
    );
  }

  private mapMessage(
    message: MailInboxMessage,
  ): MailMessageSummary {
    return {
      id: this.messageKey(
        message.mailbox,
        message.uid,
      ),

      mailbox:
      message.mailbox,

      uid:
      message.uid,

      senderName:
        message.from.name ||
        message.from.address ||
        'Unknown sender',

      senderAddress:
      message.from.address,

      subject:
      message.subject,

      preview: '',

      receivedAt:
      message.date,

      unread:
      message.unread,

      starred:
      message.starred,
    };
  }

  private messageKey(
    mailbox: string,
    uid: string,
  ): string {
    return `${mailbox}:${uid}`;
  }

  archiveMessage(
    message: MailMessageDetail,
  ): void {
    if (message.mailbox === 'Archive') {
      return;
    }

    this.archiveRequest?.unsubscribe();

    this.archiveRequest =
      this.messageService
        .archiveMessage(
          message.uid,
          message.mailbox,
        )
        .pipe(
          takeUntilDestroyed(
            this.destroyRef,
          ),
        )
        .subscribe({
          next: () => {
            this.archiveRequest = undefined;

            /*
             * UID after a Dovecot move can change.
             * Never keep the old mailbox + UID.
             *
             * Close the current message and reload
             * the active view from Dovecot.
             */
            this.closeMessage();
            this.loadCurrentFolder();
          },

          error: (error) => {
            console.error(
              '[Mail] Unable to archive message.',
              error,
            );

            this.archiveRequest = undefined;
          },
        });
  }

  trashMessage(
    message: MailMessageDetail,
  ): void {
    if (message.mailbox === 'Trash') {
      return;
    }

    this.trashRequest?.unsubscribe();

    this.trashRequest =
      this.messageService
        .trashMessage(
          message.uid,
          message.mailbox,
        )
        .pipe(
          takeUntilDestroyed(
            this.destroyRef,
          ),
        )
        .subscribe({
          next: () => {
            this.trashRequest = undefined;

            /*
             * Moving between Dovecot mailboxes can
             * change the UID, so reload the active
             * view instead of keeping the old key.
             */
            this.closeMessage();
            this.loadCurrentFolder();
          },

          error: (error) => {
            console.error(
              '[Mail] Unable to move message to Trash.',
              error,
            );

            this.trashRequest = undefined;
          },
        });
  }
}
