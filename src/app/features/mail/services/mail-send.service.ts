import {
  inject,
  Injectable,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class MailSendService {

  private readonly http =
    inject(HttpClient);


  send(
    formData: FormData,
  ) {
    return this.http.post(
      '/api/mail/send',
      formData,
    );
  }
}
