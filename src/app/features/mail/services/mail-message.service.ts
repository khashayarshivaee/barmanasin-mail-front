import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface MailMessageAddress {
  name: string;
  address: string;
  raw: string;
}

export interface MailMessageBody {
  text: string;
  html: string;
}

export interface MailMessageDetail {
  mailbox: string;
  uid: string;

  flags: string[];
  unread: boolean;
  starred: boolean;

  size: number;

  from: MailMessageAddress;

  to: string;
  cc: string;
  reply_to: string;

  subject: string;
  date: string;
  message_id: string;
  body_structure: string;

  body: MailMessageBody;
}

export interface MailMessageResponse {
  message: MailMessageDetail;
}

export interface MailMessageSeenResponse {
  message: MailMessageDetail;
  seen: boolean;
}

export interface MailMessageStarredResponse {
  message: MailMessageDetail;
  starred: boolean;
}

export interface MailMessageArchiveResponse {
  message: string;
  archived: boolean;

  source: {
    mailbox: string;
    uid: string;
  };

  destination: {
    mailbox: 'Archive';
  };
}

export interface MailMessageTrashResponse {
  message: string;
  trashed: boolean;

  source: {
    mailbox: string;
    uid: string;
  };

  destination: {
    mailbox: 'Trash';
  };
}

@Injectable({
  providedIn: 'root',
})
export class MailMessageService {
  private readonly http = inject(HttpClient);

  getMessage(
    uid: string,
    folder = 'INBOX',
  ): Observable<MailMessageResponse> {
    const params = new HttpParams()
      .set('folder', folder);

    return this.http
      .get<MailMessageResponse>(
        `${environment.apiBaseUrl}/api/mail/messages/${encodeURIComponent(uid)}`,
        {
          withCredentials: true,
          params,
        },
      )
      .pipe(
        timeout(12_000),
      );
  }

  setSeen(
    uid: string,
    seen: boolean,
    folder = 'INBOX',
  ): Observable<MailMessageSeenResponse> {
    return this.http
      .patch<MailMessageSeenResponse>(
        `${environment.apiBaseUrl}/api/mail/messages/${encodeURIComponent(uid)}/seen`,
        {
          seen,
          folder,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(12_000),
      );
  }

  setStarred(
    uid: string,
    starred: boolean,
    folder = 'INBOX',
  ): Observable<MailMessageStarredResponse> {
    return this.http
      .patch<MailMessageStarredResponse>(
        `${environment.apiBaseUrl}/api/mail/messages/${encodeURIComponent(uid)}/starred`,
        {
          starred,
          folder,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(12_000),
      );
  }

  archiveMessage(
    uid: string,
    folder = 'INBOX',
  ): Observable<MailMessageArchiveResponse> {
    return this.http
      .patch<MailMessageArchiveResponse>(
        `${environment.apiBaseUrl}/api/mail/messages/${encodeURIComponent(uid)}/archive`,
        {
          folder,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(12_000),
      );
  }

  trashMessage(
    uid: string,
    folder = 'INBOX',
  ): Observable<MailMessageTrashResponse> {
    return this.http
      .patch<MailMessageTrashResponse>(
        `${environment.apiBaseUrl}/api/mail/messages/${encodeURIComponent(uid)}/trash`,
        {
          folder,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(12_000),
      );
  }
}
