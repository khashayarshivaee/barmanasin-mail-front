import {
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  IonIcon,
  ModalController,
} from '@ionic/angular';

import {
  take,
} from 'rxjs';

import {
  addIcons,
} from 'ionicons';

import {
  mailOutline,
} from 'ionicons/icons';

import {
  MailAuthService,
} from '../../../core/auth/mail-auth.service';


@Component({
  selector: 'app-mail-welcome',
  standalone: true,
  templateUrl: './mail-welcome.component.html',
  styleUrls: ['./mail-welcome.component.scss'],
  imports: [
    IonIcon,
  ],
})
export class MailWelcomeComponent {

  private readonly modalController =
    inject(ModalController);

  private readonly mailAuthService =
    inject(MailAuthService);


  readonly isSaving =
    signal(false);

  readonly errorMessage =
    signal('');


  constructor() {
    addIcons({
      mailOutline,
    });
  }


  continue(): void {

    if (this.isSaving()) {
      return;
    }


    this.isSaving.set(true);
    this.errorMessage.set('');


    this.mailAuthService
      .markWelcomeSeen()
      .pipe(
        take(1),
      )
      .subscribe({

        next: async () => {

          this.isSaving.set(false);

          await this.modalController.dismiss({
            welcomeSeen: true,
          });

        },


        error: (error) => {

          console.error(
            '[Mail] Unable to mark welcome as seen.',
            error,
          );

          this.isSaving.set(false);

          this.errorMessage.set(
            'Unable to continue. Please try again.',
          );

        },

      });

  }

}
