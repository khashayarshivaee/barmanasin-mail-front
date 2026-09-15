import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  IonIcon,
  ModalController,
} from '@ionic/angular';

import {
  addIcons,
} from 'ionicons';

import {
  closeOutline,
  searchOutline,
} from 'ionicons/icons';

import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  switchMap,
} from 'rxjs';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  MailInboxService,
  MailInboxMessage,
} from '../services/mail-inbox.service';


@Component({
  selector: 'app-mail-search-modal',
  standalone: true,
  imports: [
    FormsModule,
    IonIcon,
  ],
  templateUrl:
    './mail-search-modal.component.html',
  styleUrl:
    './mail-search-modal.component.scss',
})
export class MailSearchModalComponent {

  private readonly service =
    inject(MailInboxService);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly modal =
    inject(ModalController);





  readonly query =
    signal('');

  readonly loading =
    signal(false);

  readonly messages =
    signal<MailInboxMessage[]>([]);

  readonly groupedMessages =
    computed(() => {

      const groups =
        new Map<string, MailInboxMessage[]>();


      for (
        const message of this.messages()
        ) {

        const folder =
          message.mailbox
            .toUpperCase();


        if (!groups.has(folder)) {

          groups.set(
            folder,
            [],
          );

        }


        groups
          .get(folder)!
          .push(message);

      }


      return Array.from(
        groups.entries(),
      ).map(
        ([folder, messages]) => ({
          folder,
          messages,
        }),
      );

    });


  private readonly search$ =
    new Subject<string>();


  constructor() {

    addIcons({
      closeOutline,
      searchOutline,
    });


    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),

        switchMap(query => {

          if (!query.trim()) {

            this.messages.set([]);

            return [];

          }


          this.loading.set(true);


          return this.service.search(
            query,
            'TEXT',
            1,
            100,
          );

        }),

        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({

        next: response => {

          this.messages.set(
            response.messages,
          );

          this.loading.set(false);

        },

        error: error => {

          console.error(
            '[Mail Search]',
            error,
          );

          this.loading.set(false);

        },

      });

  }


  updateQuery(
    value: string,
  ): void {

    this.query.set(value);

    this.search$
      .next(value);

  }


  close(): void {

    this.modal.dismiss();

  }


  openMessage(
    message: MailInboxMessage,
  ): void {

    this.modal.dismiss(
      message,
    );

  }

}
