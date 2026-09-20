import {
  inject,
  Injectable,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
  switchMap,
  timeout,
  tap,
} from 'rxjs';

import {
  environment,
} from '../../../environments/environment';


export interface MailUser {
  id: number;
  show_welcome: boolean;
  name: string;
  email: string;
  mailbox_address: string;
  mailbox_quota_mb: number;
  avatar_url: string | null;
}


export interface MailLoginResponse {
  message: string;
  user: MailUser;
  token: string;
}


export interface MailMeResponse {
  user: MailUser;
}


export interface MailLogoutResponse {
  message: string;
}

export interface MailWelcomeSeenResponse {
  message: string;
  show_welcome: boolean;
}


export interface MailAvatarResponse {
  message: string;
  avatar_url: string | null;
}



@Injectable({
  providedIn: 'root',
})
export class MailAuthService {


  private readonly http =
    inject(HttpClient);


  private readonly baseUrl =
    environment.apiBaseUrl;


  private readonly requestTimeout =
    12000;


  private readonly uploadTimeout =
    60000;



  private getToken(): string | null {

    return localStorage.getItem(
      'mail_token',
    );

  }




  login(
    email: string,
    password: string,
  ): Observable<MailLoginResponse> {


    return this.http
      .get<void>(
        `${this.baseUrl}/sanctum/csrf-cookie`,
        {
          withCredentials: true,
        },
      )
      .pipe(

        timeout(
          this.requestTimeout,
        ),


        switchMap(() =>

          this.http
            .post<MailLoginResponse>(
              `${this.baseUrl}/api/mail/auth/login`,
              {
                email,
                password,
              },
              {
                withCredentials: true,
              },
            )
            .pipe(

              timeout(
                this.requestTimeout,
              ),


              tap(response => {

                localStorage.setItem(
                  'mail_token',
                  response.token,
                );

              }),

            ),

        ),

      );

  }





  me(): Observable<MailMeResponse> {


    const token =
      this.getToken();



    return this.http
      .get<MailMeResponse>(
        `${this.baseUrl}/api/mail/auth/me`,
        {

          withCredentials:
            true,


          headers:
            token
              ? {
                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              }
              : {
                Accept:
                  'application/json',
              },

        },
      )
      .pipe(

        timeout(
          this.requestTimeout,
        ),

      );

  }







  uploadAvatar(
    file: File,
  ): Observable<MailAvatarResponse> {


    const formData =
      new FormData();


    formData.append(
      'avatar',
      file,
      file.name,
    );



    return this.http
      .post<MailAvatarResponse>(
        `${this.baseUrl}/api/mail/auth/avatar`,
        formData,
        {
          withCredentials:
            true,
        },
      )
      .pipe(

        timeout(
          this.uploadTimeout,
        ),

      );

  }







  removeAvatar(): Observable<MailAvatarResponse> {


    return this.http
      .delete<MailAvatarResponse>(
        `${this.baseUrl}/api/mail/auth/avatar`,
        {
          withCredentials:
            true,
        },
      )
      .pipe(

        timeout(
          this.requestTimeout,
        ),

      );

  }



  markWelcomeSeen(): Observable<MailWelcomeSeenResponse> {

    const token =
      this.getToken();


    return this.http
      .post<MailWelcomeSeenResponse>(
        `${this.baseUrl}/api/mail/auth/welcome-seen`,
        {},
        {
          withCredentials: true,

          headers:
            token
              ? {
                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              }
              : {
                Accept:
                  'application/json',
              },
        },
      )
      .pipe(
        timeout(
          this.requestTimeout,
        ),
      );

  }







  logout(): Observable<MailLogoutResponse> {


    const token =
      this.getToken();



    return this.http
      .post<MailLogoutResponse>(
        `${this.baseUrl}/api/mail/auth/logout`,
        {},
        {

          withCredentials:
            true,


          headers:
            token
              ? {
                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              }
              : {
                Accept:
                  'application/json',
              },

        },
      )
      .pipe(

        timeout(
          this.requestTimeout,
        ),


        tap(() => {

          localStorage.removeItem(
            'mail_token',
          );

        }),

      );

  }

}
