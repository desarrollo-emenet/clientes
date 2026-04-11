import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
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

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleheader = new EventEmitter<void>();

  showNavButtons = true;
  private routerSub!: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkRoute(window.location.pathname);

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkRoute(event.urlAfterRedirects || event.url);
      });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  private checkRoute(url: string): void {
    const cleanUrl = url.split('?')[0];
    this.showNavButtons = cleanUrl !== '/servicios';
  }

  onHamburgerClick() {
    this.toggleSidebar.emit();
  }

  onHamburger1Click() {
    this.toggleheader.emit();
  }

}
