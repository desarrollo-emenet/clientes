import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment.prod';
import { enableProdMode } from '@angular/core';
//
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

if (environment.production){
  enableProdMode();
}