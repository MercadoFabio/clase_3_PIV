import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Habilita HttpClient en toda la app. Es lo unico que agregamos al proyecto base.
    provideHttpClient(),
  ]
};
