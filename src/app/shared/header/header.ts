import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { NavComponent } from '../nav/nav';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [UserMenuComponent, NavComponent, NgIf],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {

  showNavButtons = true;
  private rutaSub!: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.verificarRuta(window.location.pathname);

    this.rutaSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.verificarRuta(event.urlAfterRedirects || event.url);
      });
  }

  ngOnDestroy(): void {
    this.rutaSub?.unsubscribe();
  }

  private verificarRuta(url: string): void {
    const urlLimpia = url.split('?')[0];
    this.showNavButtons = urlLimpia !== '/servicios';
  }
}
