import {
  Routes,
} from '@angular/router';

import {
  mailAuthGuard,
} from './core/auth/mail-auth.guard';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login.page')
        .then(m => m.LoginPage),
  },

  {
    path: 'home',
    canActivate: [mailAuthGuard],
    loadComponent: () =>
      import('./home/home.page')
        .then(m => m.HomePage),
  },

  {
    path: 'settings',
    canActivate: [mailAuthGuard],
    loadComponent: () =>
      import('./pages/settings/settings.page')
        .then(m => m.SettingsPage),
  },

  {
    path: '**',
    redirectTo: '',
  },
];
