import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { IonIcon } from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  bookmark,
  bookmarkOutline,
  star,
  starOutline,
  refreshOutline,
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
  pinned: boolean;
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
export class MailMessageListComponent implements AfterViewInit {
  readonly title =
    input('Inbox');

  readonly showPin =
    input(false);

  readonly searchQuery =
    input('');

  readonly eyebrow =
    input('MAILBOX');

  readonly toolbarLabel =
    input('Recent messages');

  readonly messages =
    input<MailMessageSummary[]>([]);

  readonly selectedMessageId =
    input<string | null>(null);

  readonly isRefreshing =
    input(false);

  @ViewChild(
    'messageListBody'
  )
  private messageListBody?: ElementRef<HTMLElement>;
  private savedScrollTop = 0;



  readonly messageSelect =
    output<MailMessageSummary>();


  readonly beforeOpen =
    output<number>();

  readonly refresh =
    output<void>();

  readonly starChange =
    output<MailMessageSummary>();

  readonly pinChange =
    output<MailMessageSummary>();

  constructor() {
    addIcons({
      star,
      starOutline,
      refreshOutline,
      bookmark,
      bookmarkOutline,
    });
  }
  ngAfterViewInit(): void {

    requestAnimationFrame(() => {

      if (
        this.messageListBody
      ) {

        this.messageListBody
          .nativeElement
          .scrollTop =
          this.savedScrollTop;

      }

    });

  }


  saveScrollPosition(): void {

    if (
      this.messageListBody
    ) {

      this.savedScrollTop =
        this.messageListBody
          .nativeElement
          .scrollTop;

    }

  }




  selectMessage(
    message: MailMessageSummary,
  ): void {

    this.beforeOpen.emit(
      this.messageListBody
        ?.nativeElement
        .scrollTop ?? 0,
    );


    this.messageSelect.emit(
      message,
    );

  }
  refreshMailbox(): void {

    if (this.isRefreshing()) {
      return;
    }

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

  togglePin(
    event: Event,
    message: MailMessageSummary,
  ): void {

    event.stopPropagation();

    this.pinChange.emit(
      message,
    );

  }

  highlight(
    value: string,
  ): string {

    const query =
      this.searchQuery().trim();

    if (!query) {
      return value;
    }


    const escaped =
      query.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );


    return value.replace(
      new RegExp(
        `(${escaped})`,
        'gi',
      ),
      '<mark>$1</mark>',
    );
  }
}
