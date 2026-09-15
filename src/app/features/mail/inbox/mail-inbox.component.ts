import {
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  output,
} from '@angular/core';


import {
  input,
} from '@angular/core';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  Subscription,
  finalize,
  debounceTime,
  distinctUntilChanged,
  Subject,
} from 'rxjs';

import {
  MailAuthService,
} from '../../../core/auth/mail-auth.service';

import {
  MailComposeDraft,
} from '../compose/mail-compose.component';

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

  private readonly mailAuthService =
    inject(MailAuthService);

  private readonly folderState =
    inject(MailFolderStateService);

  private readonly destroyRef =
    inject(DestroyRef);

  readonly replyDraftData =
    signal<MailComposeDraft | null>(null);

  private listScrollTop = 0;

  private folderRequest?: Subscription;
  private messageRequest?: Subscription;
  private readonly searchSubject =
    new Subject<string>();
  private seenRequest?: Subscription;
  private archiveRequest?: Subscription;
  private trashRequest?: Subscription;
  private replyAllRequest?: Subscription;

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

  readonly isRefreshing =
    signal(false);

  readonly isPreparingReplyAll =
    signal(false);

  readonly searchQuery =
    input<string>('');

  readonly draftEditRequested =
    output<MailMessageDetail>();

  readonly replyRequested =
    output<MailComposeDraft>();

  private previousFolder: MailFolder | null = null;


  constructor() {
    effect(() => {
      const folder = this.activeFolder();

      if (this.previousFolder !== folder) {
        this.previousFolder = folder;

        this.closeMessage();
        this.messages.set([]);
        this.loadFolder(folder, false);
      }
    });

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadFolder(
          this.activeFolder(),
          true,
        );
      });

    effect(() => {
      this.searchSubject.next(
        this.searchQuery(),
      );
    });
  }


  loadCurrentFolder(): void {
    this.loadFolder(
      this.activeFolder(),
      false,
    );
  }


  refreshCurrentFolder(): void {
    if (this.isRefreshing()) {
      return;
    }

    this.loadFolder(
      this.activeFolder(),
      true,
    );
  }
  openExternalMessage(
    message: MailInboxMessage,
  ): void {

    const summary: MailMessageSummary = {

      id:
        `${message.mailbox}:${message.uid}`,

      mailbox:
      message.mailbox,

      uid:
      message.uid,

      senderName:
        message.from.name
        || message.from.address,

      senderAddress:
      message.from.address,

      subject:
      message.subject,

      preview:
        '',

      receivedAt:
      message.date,

      unread:
      message.unread,

      starred:
      message.starred,

    };


    this.openMessage(
      summary,
    );

  }



  openMessage(
    message: MailMessageSummary,
  ): void {
    this.cancelReplyAll();

    this.messageRequest?.unsubscribe();
    this.seenRequest?.unsubscribe();

    this.selectedMessageId.set(message.id);
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
          takeUntilDestroyed(this.destroyRef),
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

            this.isMessageLoading.set(false);

            if (response.message.unread) {
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

            this.isMessageLoading.set(false);
          },
        });
  }


  replyToMessage(
    message: MailMessageDetail,
  ): void {
    this.cancelReplyAll();

    const subject =
      message.subject.startsWith('Re:')
        ? message.subject
        : `Re: ${message.subject}`;

    const body = `


On ${message.date}, ${
      message.from.name ||
      message.from.address
    } wrote:

> ${
      message.body.text
        .split('\n')
        .join('\n> ')
    }
`;

    this.replyRequested.emit({
      to: message.from.address,
      cc: '',
      bcc: '',
      subject,
      body,
      attachments: [],
      draftUid: null,
      existingAttachments: [],
    });

    this.closeMessage();
  }


  replyAllToMessage(
    message: MailMessageDetail,
  ): void {
    if (this.isPreparingReplyAll()) {
      return;
    }

    this.isPreparingReplyAll.set(true);

    this.replyAllRequest =
      this.mailAuthService
        .me()
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.isPreparingReplyAll.set(false);
          }),
        )
        .subscribe({
          next: ({ user }) => {
            const current = this.selectedMessage();

            if (
              !current ||
              current.uid !== message.uid ||
              current.mailbox !== message.mailbox
            ) {
              return;
            }

            const ownAddress =
              user.mailbox_address
                ?.trim()
                .toLowerCase();

            if (!ownAddress) {
              window.alert(
                'Unable to identify your mailbox. Please sign in again.',
              );
              return;
            }

            const usedAddresses =
              new Set<string>([ownAddress]);

            const replyAddresses =
              this.parseReplyAddresses(
                message.reply_to,
              );

            const primaryAddresses =
              replyAddresses.length > 0
                ? replyAddresses
                : this.parseReplyAddresses(
                  message.from.address,
                );

            const to = this.uniqueReplyAddresses(
              [
                ...primaryAddresses,
                ...this.parseReplyAddresses(
                  message.to,
                ),
              ],
              usedAddresses,
            );

            const cc = this.uniqueReplyAddresses(
              this.parseReplyAddresses(
                message.cc,
              ),
              usedAddresses,
            );

            if (
              to.length === 0 &&
              cc.length > 0
            ) {
              to.push(cc.shift()!);
            }

            if (to.length === 0) {
              window.alert(
                'No other recipients are available for Reply All.',
              );
              return;
            }

            const originalSubject =
              message.subject === '(No subject)'
                ? ''
                : message.subject.trim();

            const subject =
              /^re:/i.test(originalSubject)
                ? originalSubject
                : originalSubject
                  ? `Re: ${originalSubject}`
                  : 'Re:';

            const quotedBody =
              message.body.text
                .split(/\r?\n/)
                .map(line => `> ${line}`)
                .join('\n');

            const sender =
              message.from.name ||
              message.from.address;

            const body =
              `\n\n\nOn ${message.date}, ${sender} wrote:\n\n${quotedBody}\n`;

            this.replyRequested.emit({
              to: to.join(', '),
              cc: cc.join(', '),
              bcc: '',
              subject,
              body,
              attachments: [],
              draftUid: null,
              existingAttachments: [],
            });

            this.closeMessage();
          },

          error: (error) => {
            console.error(
              '[Mail] Unable to prepare Reply All.',
              error,
            );

            window.alert(
              'Unable to prepare Reply All. Please try again.',
            );
          },
        });
  }


  toggleMessageStar(
    message: MailMessageSummary,
  ): void {
    const key = message.id;
    const starred = !message.starred;

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
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (response) => {
            if (
              this.activeFolder() === 'starred' &&
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

            this.starRequests.delete(key);
          },

          error: (error) => {
            console.error(
              '[Mail] Unable to update star state.',
              error,
            );

            this.starRequests.delete(key);
            this.loadCurrentFolder();
          },
        });

    this.starRequests.set(key, request);
  }


  closeMessage(): void {
    this.cancelReplyAll();

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

    requestAnimationFrame(() => {
      const element =
        document.querySelector(
          '.message-list__body',
        ) as HTMLElement | null;

      if (!element) {
        return;
      }

      element.scrollTop = this.listScrollTop;
    });
  }


  retryMessage(): void {
    const selectedId =
      this.selectedMessageId();

    if (!selectedId) {
      return;
    }

    const summary =
      this.messages().find(
        message => message.id === selectedId,
      );

    if (!summary) {
      return;
    }

    this.openMessage(summary);
  }


  folderTitle(): string {
    switch (this.activeFolder()) {
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
    switch (this.activeFolder()) {
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
    switch (this.activeFolder()) {
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
    forceRefresh = false,
  ): void {
    this.folderRequest?.unsubscribe();

    if (forceRefresh) {
      this.isRefreshing.set(true);
    }

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


    const search =
      this.searchQuery().trim();


    if (search !== '') {

      this.folderRequest =
        this.inboxService
          .search(
            search,
            'TEXT',
            1,
            100,
          )
          .pipe(
            takeUntilDestroyed(
              this.destroyRef,
            ),
          )
          .subscribe({
            next: (response) => {

              this.messages.set(
                response.messages.map(
                  message =>
                    this.mapMessage(message),
                ),
              );

              this.isRefreshing.set(false);
            },

            error: (error) => {

              console.error(
                '[Mail] Unable to search mailbox.',
                error,
              );

              this.messages.set([]);

              this.isRefreshing.set(false);
            },
          });


      return;
    }


    const source =
      folder === 'starred'
        ? this.inboxService.getStarred(forceRefresh)
        : folder === 'sent'
          ? this.inboxService.getSent(forceRefresh)
          : folder === 'drafts'
            ? this.inboxService.getDrafts(forceRefresh)
            : folder === 'archive'
              ? this.inboxService.getArchive(forceRefresh)
              : folder === 'trash'
                ? this.inboxService.getTrash(forceRefresh)
                : this.inboxService.getInbox(forceRefresh);


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
                message =>
                  this.mapMessage(message),
              ),
            );

            this.isRefreshing.set(false);
          },

          error: (error) => {

            console.error(
              `[Mail] Unable to load ${folder}.`,
              error,
            );

            this.messages.set([]);

            this.isRefreshing.set(false);
          },
        });
  }


  private markMessageSeen(
    uid: string,
    mailbox: string,
  ): void {
    this.markSummarySeen(mailbox, uid);

    this.seenRequest =
      this.messageService
        .setSeen(uid, true, mailbox)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (response) => {
            this.selectedMessage.update(
              current => {
                if (
                  !current ||
                  current.uid !== uid ||
                  current.mailbox !== mailbox
                ) {
                  return current;
                }

                return response.message;
              },
            );

            this.markSummarySeen(mailbox, uid);
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
    const id = this.messageKey(mailbox, uid);

    this.messages.update(
      messages =>
        messages.map(
          message =>
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
    const id = this.messageKey(mailbox, uid);

    this.messages.update(
      messages =>
        messages.map(
          message =>
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
    const id = this.messageKey(mailbox, uid);

    this.messages.update(
      messages =>
        messages.filter(
          message => message.id !== id,
        ),
    );
  }


  private updateSelectedMessageStarred(
    mailbox: string,
    uid: string,
    starred: boolean,
  ): void {
    this.selectedMessage.update(
      message => {
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

      mailbox: message.mailbox,
      uid: message.uid,

      senderName:
        message.from.name ||
        message.from.address ||
        'Unknown sender',

      senderAddress: message.from.address,
      subject: message.subject,
      preview: '',
      receivedAt: message.date,
      unread: message.unread,
      starred: message.starred,
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
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => {
            this.archiveRequest = undefined;

            // Moving between mailboxes can change the UID.
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
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => {
            this.trashRequest = undefined;

            // Moving between mailboxes can change the UID.
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


  saveListScroll(
    value: number,
  ): void {
    this.listScrollTop = value;
  }


  private cancelReplyAll(): void {
    this.replyAllRequest?.unsubscribe();
    this.replyAllRequest = undefined;
    this.isPreparingReplyAll.set(false);
  }


  private parseReplyAddresses(
    value: string,
  ): string[] {
    if (!value?.trim()) {
      return [];
    }

    const entries: string[] = [];

    let current = '';
    let inQuotes = false;
    let escaped = false;
    let angleDepth = 0;

    for (const character of value) {
      if (escaped) {
        current += character;
        escaped = false;
        continue;
      }

      if (
        character === '\\' &&
        inQuotes
      ) {
        current += character;
        escaped = true;
        continue;
      }

      if (character === '"') {
        inQuotes = !inQuotes;
      }

      if (!inQuotes) {
        if (character === '<') {
          angleDepth++;
        } else if (character === '>') {
          angleDepth = Math.max(
            0,
            angleDepth - 1,
          );
        }

        if (
          (
            character === ',' ||
            character === ';'
          ) &&
          angleDepth === 0
        ) {
          entries.push(current);
          current = '';
          continue;
        }
      }

      current += character;
    }

    entries.push(current);

    return entries
      .map(entry => {
        const trimmed = entry.trim();

        const angleAddress =
          trimmed.match(/<([^<>]+)>/);

        return (
          angleAddress
            ? angleAddress[1]
            : trimmed
        ).trim();
      })
      .filter(address => address.length > 0);
  }


  private uniqueReplyAddresses(
    addresses: string[],
    usedAddresses: Set<string>,
  ): string[] {
    return addresses.filter(address => {
      const key = address.toLowerCase();

      if (usedAddresses.has(key)) {
        return false;
      }

      usedAddresses.add(key);
      return true;
    });
  }
}
