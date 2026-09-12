import {
  inject,
  Injectable,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
  timeout,
} from 'rxjs';

import {
  environment,
} from '../../../../environments/environment';


export interface MailDraftPayload {
  to: string;
  cc: string;
  bcc: string;

  subject: string;
  body: string;

  attachments: number[];

  existing_attachments?: string[];
}


export interface MailDraftSaveResponse {
  message: string;
  saved: boolean;
}


export interface MailDraftUpdateResponse {
  message: string;
  updated: boolean;
}

export interface MailDraftDeleteResponse {
  message: string;
  deleted: boolean;
}


@Injectable({
  providedIn: 'root',
})
export class MailDraftService {

  private readonly http =
    inject(HttpClient);


  saveDraft(
    payload: MailDraftPayload,
  ): Observable<MailDraftSaveResponse> {
    return this.http
      .post<MailDraftSaveResponse>(
        `${environment.apiBaseUrl}/api/mail/drafts`,
        payload,
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(20_000),
      );
  }


  updateDraft(
    uid: string,
    payload: MailDraftPayload,
  ): Observable<MailDraftUpdateResponse> {
    return this.http
      .put<MailDraftUpdateResponse>(
        `${environment.apiBaseUrl}/api/mail/drafts/${encodeURIComponent(uid)}`,
        payload,
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(30_000),
      );
  }

  deleteDraft(
    uid: string,
  ): Observable<MailDraftDeleteResponse> {
    return this.http
      .delete<MailDraftDeleteResponse>(
        `${environment.apiBaseUrl}/api/mail/drafts/${encodeURIComponent(uid)}`,
        {
          withCredentials: true,
        },
      )
      .pipe(
        timeout(20_000),
      );
  }

}
