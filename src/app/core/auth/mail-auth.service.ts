import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface MailUser {
  id: number;
  name: string;
  email: string;
  mailbox_address: string;
  mailbox_quota_mb: number;
}

export interface MailLoginResponse {
  message: string;
  user: MailUser;
}

export interface MailMeResponse {
  user: MailUser;
}

export interface MailLogoutResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class MailAuthService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiBaseUrl;

  login(email: string, password: string): Observable<MailLoginResponse> {
    return this.http
      .get<void>(`${this.baseUrl}/sanctum/csrf-cookie`, {
        withCredentials: true,
      })
      .pipe(
        switchMap(() =>
          this.http.post<MailLoginResponse>(
            `${this.baseUrl}/api/mail/auth/login`,
            {
              email,
              password,
            },
            {
              withCredentials: true,
            },
          ),
        ),
      );
  }

  me(): Observable<MailMeResponse> {
    return this.http.get<MailMeResponse>(
      `${this.baseUrl}/api/mail/auth/me`,
      {
        withCredentials: true,
      },
    );
  }

  logout(): Observable<MailLogoutResponse> {
    return this.http.post<MailLogoutResponse>(
      `${this.baseUrl}/api/mail/auth/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }
}
