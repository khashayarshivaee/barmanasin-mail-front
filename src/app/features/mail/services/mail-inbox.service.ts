import {
  inject,
  Injectable,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
  of,
  tap,
  timeout,
} from 'rxjs';

import {
  environment,
} from '../../../../environments/environment';


export type MailCachedFolder =
  | 'inbox'
  | 'sent'
  | 'drafts'
  | 'starred'
  | 'archive'
  | 'trash';


export interface MailInboxSender {
  name: string;
  address: string;
  raw: string;
}


export interface MailInboxMessage {
  mailbox: string;
  uid: string;

  flags: string[];
  unread: boolean;
  starred: boolean;

  from: MailInboxSender;

  to: string;
  subject: string;
  date: string;
}


export interface MailInboxResponse {
  mailbox: {
    address: string;
    quota_mb: number | null;
  };

  messages: MailInboxMessage[];

  meta: {
    total: number;
    unread?: number;
  };
}


interface MailFolderCacheEntry {
  response: MailInboxResponse;
  storedAt: number;
}


@Injectable({
  providedIn: 'root',
})
export class MailInboxService {

  private static readonly CACHE_TTL =
    30_000;


  private readonly http =
    inject(HttpClient);


  private readonly cache =
    new Map<
      MailCachedFolder,
      MailFolderCacheEntry
    >();


  getInbox(
    forceRefresh = false,
  ): Observable<MailInboxResponse> {
    return this.getFolder(
      'inbox',
      '/api/mail/inbox',
      forceRefresh,
    );
  }


  getSent(
    forceRefresh = false,
  ): Observable<MailInboxResponse> {
    return this.getFolder(
      'sent',
      '/api/mail/sent',
      forceRefresh,
    );
  }


  getDrafts(
    forceRefresh = false,
  ): Observable<MailInboxResponse> {
    return this.getFolder(
      'drafts',
      '/api/mail/drafts',
      forceRefresh,
    );
  }


  getStarred(
    forceRefresh = false,
  ): Observable<MailInboxResponse> {
    return this.getFolder(
      'starred',
      '/api/mail/starred',
      forceRefresh,
    );
  }


  getArchive(
    forceRefresh = false,
  ): Observable<MailInboxResponse> {
    return this.getFolder(
      'archive',
      '/api/mail/archive',
      forceRefresh,
    );
  }


  getTrash(
    forceRefresh = false,
  ): Observable<MailInboxResponse> {
    return this.getFolder(
      'trash',
      '/api/mail/trash',
      forceRefresh,
    );
  }


  invalidate(
    folder?: MailCachedFolder,
  ): void {

    if (folder) {
      this.cache.delete(
        folder,
      );

      return;
    }


    this.cache.clear();
  }


  private getFolder(
    folder: MailCachedFolder,
    endpoint: string,
    forceRefresh: boolean,
  ): Observable<MailInboxResponse> {

    if (!forceRefresh) {

      const cached =
        this.cache.get(
          folder,
        );


      if (
        cached
        &&
        Date.now() - cached.storedAt
        < MailInboxService.CACHE_TTL
      ) {
        return of(
          cached.response,
        );
      }

    }


    return this.http
      .get<MailInboxResponse>(
        `${environment.apiBaseUrl}${endpoint}`,
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(12_000),

        tap(
          response => {

            this.cache.set(
              folder,
              {
                response,
                storedAt:
                  Date.now(),
              },
            );

          },
        ),
      );
  }

}
