import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';

import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

import {
  provideHttpClient, /*, withInterceptors*/
  withInterceptors
} from '@angular/common/http';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { authInterceptor } from './guards/auth.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled'
    })),
    provideNativeDateAdapter(),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }


  ]
};
