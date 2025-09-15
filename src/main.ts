import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import 'zone.js'; 
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app/app.routes';



bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
  ],
});
