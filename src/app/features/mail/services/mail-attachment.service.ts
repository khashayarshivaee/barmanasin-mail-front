import {
  Injectable,
  inject,
} from '@angular/core';

import {
  HttpClient,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';


export interface MailAttachmentUploadEvent {

  type:
    | 'progress'
    | 'success'
    | 'error';

  progress?: number;

  response?: any;

}



@Injectable({
  providedIn: 'root',
})
export class MailAttachmentService {


  private readonly http =
    inject(HttpClient);



  upload(
    file: File,
  ): Observable<HttpEvent<any>> {


    const formData =
      new FormData();



    formData.append(
      'file',
      file,
    );



    return this.http.post(
      '/api/mail/attachments',
      formData,
      {
        reportProgress: true,
        observe: 'events',
      },
    );


  }

}
