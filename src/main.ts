import { bootstrapApplication } from '@angular/platform-browser';

import {
  isDevMode,
} from '@angular/core';

import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';

import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular';

import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';

import {
  provideServiceWorker,
} from '@angular/service-worker';

import {
  mailAuthInterceptor,
} from './app/features/mail-auth.interceptor';

import {
  routes,
} from './app/app.routes';

import {
  AppComponent,
} from './app/app.component';


bootstrapApplication(
  AppComponent,
  {
    providers: [
      {
        provide:
        RouteReuseStrategy,

        useClass:
        IonicRouteStrategy,
      },

      provideIonicAngular(),

      provideHttpClient(
        withInterceptors([
          mailAuthInterceptor,
        ]),
      ),

      provideRouter(
        routes,
        withPreloading(
          PreloadAllModules,
        ),
        withComponentInputBinding(),
      ),

      provideServiceWorker(
        'ngsw-worker.js',
        {
          enabled:
            !isDevMode(),

          registrationStrategy:
            'registerWhenStable:30000',
        },
      ),
    ],
  },
);
