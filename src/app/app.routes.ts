import { Routes } from '@angular/router';

import { requireAuthGuard } from './guards/require-auth-guard';

import { Login } from './auth/login/login';
import { CreateAccount } from './auth/create-account/create-account';
import { Recover } from './auth/recover/recover';
import { ResponseRecover } from './auth/responseRecover/response-recover';

import { Dashboard } from './pages/dashboard/dashboard';
import { Client } from './pages/client/client';
import { Payment } from './pages/payment/payment';
import { Profile } from './pages/profile/profile';
import { Visits } from './pages/visits/visits';
import { EditProfile } from './pages/edit-profile/edit-profile';
import { EmailVerificado } from './auth/email-verificado/email-verificado';
import { emailVerificadoGuard } from './guards/email-verificado-guard';
import { Service } from './pages/service/service';
import { serviceAccessGuard } from './guards/service-access-guard';
import { Notification } from './pages/notification/notification';
import { Component } from '@angular/core';
import { FAQ } from './pages/faq/faq';


export const routes: Routes = [
  { path: '', redirectTo: '/iniciar-sesion', pathMatch: 'full' },    //si no coinicide con ninguna ruta regresa al inicio de sesion

  { path: 'iniciar-sesion', component: Login },
  { path: 'crear-cuenta', component: CreateAccount },
  { path: 'recuperar-password', component: Recover },
  { path: 'response-password', component: ResponseRecover},
  { path: 'email-verificado', component: EmailVerificado, canActivate: [emailVerificadoGuard] },


  // Requieren login   
  { path: 'dashboard/:numero_cliente', component: Dashboard, canActivate: [requireAuthGuard, serviceAccessGuard] },
  { path: 'servicios', component: Service, canActivate: [requireAuthGuard] },
  { path: 'estadoCuenta/:numero_cliente', component: Client, canActivate: [requireAuthGuard] },
  { path: 'formas-de-pago', component: Payment, canActivate: [requireAuthGuard] },
  { path: 'perfil/:numero_cliente', component: Profile, canActivate: [requireAuthGuard] },
  { path: 'visitas', component: Visits, canActivate: [requireAuthGuard] },
  { path: 'edit-perfil', component: EditProfile, canActivate: [requireAuthGuard] },
  { path: 'notificaciones/:numero_cliente', component: Notification, canActivate: [requireAuthGuard] },
  { path: 'faq', component: FAQ },

  
  { path: '**', redirectTo: '/iniciar-sesion' }

];
