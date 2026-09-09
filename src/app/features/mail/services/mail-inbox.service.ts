import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { environment } from '../../../../environments/environment';

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

@Injectable({
  providedIn: 'root',
})
export class MailInboxService {
  private readonly http = inject(HttpClient);

  getInbox(): Observable<MailInboxResponse> {
    return this.http
      .get<MailInboxResponse>(
        `${environment.apiBaseUrl}/api/mail/inbox`,
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(12_000),
      );
  }

  getSent(): Observable<MailInboxResponse> {
    return this.http
      .get<MailInboxResponse>(
        `${environment.apiBaseUrl}/api/mail/sent`,
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(12_000),
      );
  }

  getStarred(): Observable<MailInboxResponse> {
    return this.http
      .get<MailInboxResponse>(
        `${environment.apiBaseUrl}/api/mail/starred`,
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(12_000),
      );
  }

  getArchive(): Observable<MailInboxResponse> {
    return this.http
      .get<MailInboxResponse>(
        `${environment.apiBaseUrl}/api/mail/archive`,
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(12_000),
      );
  }

  getTrash(): Observable<MailInboxResponse> {
    return this.http
      .get<MailInboxResponse>(
        `${environment.apiBaseUrl}/api/mail/trash`,
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(12_000),
      );
  }
}
