import { ApplicationConfig, provideBrowserGlobalErrorListeners, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AppErrorHandler } from './core/error-handler/app-error.handler';

import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideRouter(routes),
    provideEchartsCore({ echarts }),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: ErrorHandler, useClass: AppErrorHandler },
  ],
};

