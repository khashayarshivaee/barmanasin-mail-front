import { Component } from '@angular/core';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
  ],
})
export class LoginPage {
  email = '';
  password = '';
  showPassword = false;

  constructor() {
    addIcons({
      arrowForwardOutline,
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      mailOutline,
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
