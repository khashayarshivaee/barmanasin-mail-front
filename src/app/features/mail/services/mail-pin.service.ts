import {
  Injectable,
  inject,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

import {
  environment,
} from '../../../../environments/environment';


import {
  MailMessageSummary,
} from '../message-list/mail-message-list.component';



interface MailPinnedResponse {

  pinned: MailMessageSummary[];

}



@Injectable({
  providedIn: 'root',
})
export class MailPinService {


  private readonly http =
    inject(HttpClient);


  private readonly baseUrl =
    environment.apiBaseUrl;



  getPinned(): Observable<MailPinnedResponse> {

    return this.http.get<MailPinnedResponse>(
      `${this.baseUrl}/api/mail/pinned`,
      {
        withCredentials: true,
      },
    );

  }




  pin(
    uid: string,
    mailbox: string,
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/api/mail/messages/${encodeURIComponent(uid)}/pin`,
      {
        mailbox,
      },
      {
        withCredentials: true,
      },
    );

  }





  unpin(
    uid: string,
    mailbox: string,
  ): Observable<any> {

    return this.http.delete(
      `${this.baseUrl}/api/mail/messages/${encodeURIComponent(uid)}/pin`,
      {
        body: {
          mailbox,
        },
        withCredentials: true,
      },
    );

  }


}
