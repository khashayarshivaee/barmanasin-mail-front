import {
  Component,
  input,
  output,
} from '@angular/core';

import { IonIcon } from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  star,
  starOutline,
} from 'ionicons/icons';

export interface MailMessageSummary {
  id: string;

  mailbox: string;
  uid: string;

  senderName: string;
  senderAddress: string;

  subject: string;
  preview: string;

  receivedAt: string;

  unread: boolean;
  starred: boolean;
}

@Component({
  selector: 'app-mail-message-list',
  standalone: true,
  templateUrl: './mail-message-list.component.html',
  styleUrl: './mail-message-list.component.scss',
  imports: [
    IonIcon,
  ],
})
export class MailMessageListComponent {
  readonly title =
    input('Inbox');

  readonly eyebrow =
    input('MAILBOX');

  readonly toolbarLabel =
    input('Recent messages');

  readonly messages =
    input<MailMessageSummary[]>([]);

  readonly selectedMessageId =
    input<string | null>(null);

  readonly messageSelect =
    output<MailMessageSummary>();

  readonly refresh =
    output<void>();

  readonly starChange =
    output<MailMessageSummary>();

  constructor() {
    addIcons({
      star,
      starOutline,
    });
  }

  selectMessage(
    message: MailMessageSummary,
  ): void {
    this.messageSelect.emit(
      message,
    );
  }

  refreshMailbox(): void {
    this.refresh.emit();
  }

  toggleStar(
    event: Event,
    message: MailMessageSummary,
  ): void {
    event.stopPropagation();

    this.starChange.emit(
      message,
    );
  }
}
