import {
  Injectable,
  inject,
  signal,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  environment,
} from '../../../../environments/environment';



export interface MailFolderBadge {

  total: number;

  unread: number;

}



export interface MailFolderStatsResponse {

  folders: Record<
    string,
    MailFolderBadge
  >;

}



@Injectable({
  providedIn: 'root',
})
export class MailFolderBadgeService {


  private readonly http =
    inject(HttpClient);



  readonly badges =
    signal<
      Record<string, MailFolderBadge>
    >({});



  load(): void {

    this.http
      .get<MailFolderStatsResponse>(
        `${environment.apiBaseUrl}/api/mail/folder-stats`,
        {
          withCredentials: true,
        },
      )
      .subscribe({

        next: response => {

          this.badges.set(
            response.folders,
          );

        },


        error: error => {

          console.error(
            '[Mail] Unable to load folder stats.',
            error,
          );

        },

      });

  }


  update(
    folders: Record<string, MailFolderBadge>,
  ): void {

    this.badges.set(
      folders,
    );

  }


  get(
    folder: string,
  ): MailFolderBadge {

    return (
      this.badges()[folder]
      ??
      {
        total: 0,
        unread: 0,
      }
    );

  }

}
