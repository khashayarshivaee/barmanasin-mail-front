import {
  inject,
  Injectable,
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


export interface MailTeamProfile {
  id: number | null;

  name_en: string | null;
  name_fa: string | null;

  job_title_en: string | null;
  job_title_fa: string | null;

  department_en: string | null;
  department_fa: string | null;

  bio_en: string | null;
  bio_fa: string | null;

  photo_url: string | null;
  has_custom_photo: boolean;

  linkedin_url: string | null;

  public_email: string | null;
  public_phone: string | null;

  show_email: boolean;
  show_phone: boolean;

  is_public: boolean;

  approval_status:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected';

  submitted_at: string | null;
  approved_at: string | null;
}


export interface MailTeamProfileUpdate {
  name_en: string | null;
  name_fa: string | null;

  job_title_en: string | null;
  job_title_fa: string | null;

  department_en: string | null;
  department_fa: string | null;

  bio_en: string | null;
  bio_fa: string | null;

  linkedin_url: string | null;

  public_email: string | null;
  public_phone: string | null;

  show_email: boolean;
  show_phone: boolean;

  is_public: boolean;
}


interface MailTeamProfileResponse {
  profile: MailTeamProfile;
}


interface MailTeamProfileSaveResponse
  extends MailTeamProfileResponse {
  message: string;
}


@Injectable({
  providedIn: 'root',
})
export class MailTeamProfileService {
  private readonly http =
    inject(HttpClient);

  private readonly endpoint =
    `${environment.apiBaseUrl}/api/mail/team-profile`;


  getProfile():
    Observable<MailTeamProfileResponse> {

    return this.http.get<MailTeamProfileResponse>(
      this.endpoint,
    );

  }


  updateProfile(
    payload: MailTeamProfileUpdate,
  ): Observable<MailTeamProfileSaveResponse> {

    return this.http.put<MailTeamProfileSaveResponse>(
      this.endpoint,
      payload,
    );

  }


  uploadPhoto(
    file: File,
  ): Observable<MailTeamProfileSaveResponse> {

    const formData =
      new FormData();

    formData.append(
      'photo',
      file,
    );

    return this.http.post<MailTeamProfileSaveResponse>(
      `${this.endpoint}/photo`,
      formData,
    );

  }


  deletePhoto():
    Observable<MailTeamProfileSaveResponse> {

    return this.http.delete<MailTeamProfileSaveResponse>(
      `${this.endpoint}/photo`,
    );

  }
}
