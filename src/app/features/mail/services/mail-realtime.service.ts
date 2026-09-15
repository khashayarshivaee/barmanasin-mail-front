import {
  Injectable,
  inject,
} from '@angular/core';

import Echo from 'laravel-echo';

import Pusher from 'pusher-js';

import {
  Subject,
} from 'rxjs';

import {
  MailFolderBadgeService,
} from './mail-folder-badge.service';


(window as any).Pusher = Pusher;


@Injectable({
  providedIn: 'root',
})
export class MailRealtimeService {


  private echo?: Echo<any>;


  private readonly badgeService =
    inject(MailFolderBadgeService);



  readonly folderUpdated =
    new Subject<Record<string, any>>();



  readonly messageReceived =
    new Subject<void>();



  connect(
    userId: number,
  ): void {


    console.log(
      '[Realtime] connect called',
      userId,
    );



    if (this.echo) {

      console.log(
        '[Realtime] already connected',
      );

      return;

    }



    this.echo =
      new Echo<any>({

        broadcaster: 'reverb',

        key: 'barmanasin-key',

        wsHost:
          'mail.barmanasin.com',

        wsPort:
          80,

        wssPort:
          443,

        forceTLS:
          true,

        enabledTransports: [
          'ws',
          'wss',
        ],

        disableStats:
          true,


        authEndpoint:
          'https://mail.barmanasin.com/broadcasting/auth',


        auth: {

          headers: {

            Authorization:
              `Bearer ${localStorage.getItem('mail_token')}`,

          },

          withCredentials:
            true,

        },

      });



    console.log(
      '[Realtime] Echo created',
      this.echo,
    );



    const pusher =
      (this.echo.connector as any).pusher;



    pusher.connection.bind(
      'state_change',
      (states: any) => {

        console.log(
          '[Realtime] state change',
          states,
        );

      },
    );



    pusher.connection.bind(
      'connected',
      () => {

        console.log(
          '[Realtime] pusher connected',
        );

      },
    );



    const connector =
      (this.echo.connector as any);



    if (
      connector?.pusher?.connection
    ) {

      connector.pusher.connection.bind(
        'connected',
        () => {

          console.log(
            '[Realtime] websocket connected',
          );

        },
      );


      connector.pusher.connection.bind(
        'error',
        (error: any) => {

          console.error(
            '[Realtime] websocket error',
            error,
          );

        },
      );

    }



    const channel =
      `mailbox.${userId}`;



    console.log(
      '[Realtime] subscribing',
      channel,
    );



    const privateChannel =
      this.echo.private(
        channel,
      );



    privateChannel.subscribed(
      () => {

        console.log(
          '[Realtime] subscribed successfully',
          channel,
        );

      },
    );



    privateChannel.error(
      (error: any) => {

        console.error(
          '[Realtime] private channel error',
          error,
        );

      },
    );



    /**
     * Folder state changes:
     *
     * - read/unread
     * - star
     * - move
     * - folder counters
     *
     * Only update badges.
     */
    privateChannel.listen(
      '.folder.updated',
      (event: any) => {


        console.log(
          '[Mail Folder Updated]',
          event,
        );



        if (event?.folders) {

          this.badgeService.update(
            event.folders,
          );




        }

      },
    );



    /**
     * New incoming mail:
     *
     * - refresh badge from server
     * - tell Inbox to reload
     */
    privateChannel.listen(
      '.message.received',
      (event: any) => {





        this.badgeService.load();



        this.messageReceived.next();

      },
    );



    console.log(
      '[Realtime] private channel registered',
    );

  }



  disconnect(): void {


    console.log(
      '[Realtime] disconnect',
    );



    this.echo?.disconnect();



    this.echo = undefined;

  }

}
