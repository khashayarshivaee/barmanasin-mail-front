import {
  Component,
  input,
  output,
} from '@angular/core';

import { IonIcon } from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  archiveOutline,
  trashOutline,
} from 'ionicons/icons';

import {
  MailMessageDetail,
} from '../services/mail-message.service';

@Component({
  selector: 'app-mail-message-view',
  standalone: true,
  templateUrl: './mail-message-view.component.html',
  styleUrl: './mail-message-view.component.scss',
  imports: [
    IonIcon,
  ],
})
export class MailMessageViewComponent {
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
      trashOutline,
    });
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

    const parts = source
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
}
